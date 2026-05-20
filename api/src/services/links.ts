import { randomUUID } from "node:crypto";

import { getDb, schema } from "@nutcrack/db";
import {
  and,
  eq,
  inArray,
  isNotNull,
  like,
  ne,
  or,
  sql,
  type SQL,
} from "drizzle-orm";
import type {
  AdminLinksQuery,
  LinksQuery,
  ProcessingStatus,
} from "@nutcrack/shared";

import { logAiAnalysis, logError, logScraping } from "../lib/logger.js";
import { extractDomain } from "../lib/utils.js";
import { analyzeLinkContent } from "./link-analyze.js";
import { scrapeLinkWithJina } from "./link-scrape.js";
import { getAiSettings } from "./settings.js";

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export class LinkValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LinkValidationError";
  }
}

function getPublishValidationMessage(link: {
  title: string | null;
  summary: string | null;
  category_id: string | null;
  tags: string[] | null;
}) {
  const missing: string[] = [];

  if (!link.title?.trim()) missing.push("标题");
  if (!link.summary?.trim()) missing.push("摘要");
  if (!link.category_id) missing.push("分类");
  if (!link.tags || link.tags.length === 0) missing.push("标签");

  if (missing.length === 0) return null;
  return `请先补全${missing.join("、")}`;
}

// ---------------------------------------------------------------------------
// Row mapping
// ---------------------------------------------------------------------------

// Wire-shape exposed by service functions. Existing routes consume this object
// via snake_case property names, so the drizzle camelCase columns are mapped
// back to snake_case before returning.
type LinkRow = typeof schema.links.$inferSelect;

interface LinkWithExtras {
  id: string;
  url: string;
  original_title: string | null;
  original_description: string | null;
  original_content: string | null;
  title: string | null;
  summary: string | null;
  key_points: string[];
  category: string | null;
  ai_title: string | null;
  ai_summary: string | null;
  ai_key_points: string[];
  ai_category: string | null;
  status: LinkRow["status"];
  processing_status: LinkRow["processingStatus"];
  published_at: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  process_error: string | null;
  tags: string[];
  ai_tags: string[];
}

// Note: `category_id` is intentionally NOT exposed on the mapped wire-shape.
// Routes consume `category` (name) only; the raw `categoryId` stays internal.
function mapLinkRow(
  row: LinkRow,
  extras: { categoryName: string | null; tags: string[]; aiTags: string[] },
): LinkWithExtras {
  return {
    id: row.id,
    url: row.url,
    original_title: row.originalTitle,
    original_description: row.originalDescription,
    original_content: row.originalContent,
    title: row.title,
    summary: row.summary,
    key_points: row.keyPoints,
    category: extras.categoryName,
    ai_title: row.aiTitle,
    ai_summary: row.aiSummary,
    ai_key_points: row.aiKeyPoints,
    ai_category: row.aiCategory,
    status: row.status,
    processing_status: row.processingStatus,
    published_at: row.publishedAt,
    created_at: row.createdAt,
    updated_at: row.updatedAt,
    created_by: row.createdBy,
    process_error: row.processError,
    tags: extras.tags,
    ai_tags: extras.aiTags,
  };
}

// Fetch tag arrays (manual + AI) for a single link in one round-trip per junction.
async function fetchTagsForLink(linkId: string) {
  const db = getDb();
  const [tagRows, aiTagRows] = await Promise.all([
    db
      .select({ tag: schema.linkTags.tag })
      .from(schema.linkTags)
      .where(eq(schema.linkTags.linkId, linkId)),
    db
      .select({ tag: schema.linkAiTags.tag })
      .from(schema.linkAiTags)
      .where(eq(schema.linkAiTags.linkId, linkId)),
  ]);
  return {
    tags: tagRows.map((r) => r.tag),
    aiTags: aiTagRows.map((r) => r.tag),
  };
}

// Batch-fetch tags + ai_tags for a set of link ids and return per-id arrays.
async function fetchTagsForLinks(linkIds: string[]) {
  const tagsByLink = new Map<string, string[]>();
  const aiTagsByLink = new Map<string, string[]>();
  if (linkIds.length === 0) return { tagsByLink, aiTagsByLink };

  const db = getDb();
  const [tagRows, aiTagRows] = await Promise.all([
    db
      .select()
      .from(schema.linkTags)
      .where(inArray(schema.linkTags.linkId, linkIds)),
    db
      .select()
      .from(schema.linkAiTags)
      .where(inArray(schema.linkAiTags.linkId, linkIds)),
  ]);

  for (const row of tagRows) {
    const list = tagsByLink.get(row.linkId);
    if (list) list.push(row.tag);
    else tagsByLink.set(row.linkId, [row.tag]);
  }
  for (const row of aiTagRows) {
    const list = aiTagsByLink.get(row.linkId);
    if (list) list.push(row.tag);
    else aiTagsByLink.set(row.linkId, [row.tag]);
  }

  return { tagsByLink, aiTagsByLink };
}

// Postgres `overlaps(tags, [...])` becomes an EXISTS subquery over link_tags.
// `inArray()` is used here because better-sqlite3 cannot bind a JS array to a
// single placeholder; drizzle's `inArray` expands the list into individual
// bound parameters which is what SQLite expects.
function tagsOverlapFilter(tagList: string[]): SQL {
  return sql`EXISTS (
    SELECT 1 FROM ${schema.linkTags}
    WHERE ${schema.linkTags.linkId} = ${schema.links.id}
      AND ${inArray(schema.linkTags.tag, tagList)}
  )`;
}

// Map a sort_by string to the corresponding drizzle column. Unknown values
// fall back to created_at to preserve legacy behaviour.
function resolveLinkSortColumn(sortBy: string | undefined) {
  switch (sortBy) {
    case "published_at":
      return schema.links.publishedAt;
    case "updated_at":
      return schema.links.updatedAt;
    case "title":
      return schema.links.title;
    case "url":
      return schema.links.url;
    case "status":
      return schema.links.status;
    case "processing_status":
      return schema.links.processingStatus;
    case "created_at":
    default:
      return schema.links.createdAt;
  }
}

// SQLite defaults to NULLs-first for ASC and NULLs-last for DESC; force
// NULLs-last in both directions to match the legacy `nullsFirst: false` path.
function orderByLink(sortBy: string | undefined, ascending: boolean): SQL {
  const col = resolveLinkSortColumn(sortBy);
  return ascending ? sql`${col} ASC NULLS LAST` : sql`${col} DESC NULLS LAST`;
}

async function getCategoryIdByName(name: string) {
  const db = getDb();
  const row = await db
    .select({ id: schema.categories.id })
    .from(schema.categories)
    .where(eq(schema.categories.name, name))
    .get();
  return row?.id ?? null;
}

// ---------------------------------------------------------------------------
// Create / process pipeline
// ---------------------------------------------------------------------------

export async function createLink(url: string, createdBy: string) {
  const db = getDb();
  const id = randomUUID();
  const inserted = db
    .insert(schema.links)
    .values({
      id,
      url,
      status: "pending",
      processingStatus: "queued",
      createdBy,
    })
    .returning()
    .get();

  // Process async (scrape + AI). Fire-and-forget; errors are logged only.
  processLinkAsync(inserted.id).catch((err) =>
    logError("Process link error", { error: err, linkId: inserted.id }),
  );

  // Newly-created link has no tag rows yet; return the wire-shape mapping
  // with empty arrays to match the legacy contract.
  return mapLinkRow(inserted, {
    categoryName: null,
    tags: [],
    aiTags: [],
  });
}

// Shared: run AI analysis and write results to DB.
// Handles no-API-key fallback and rewrites the ai_tags junction in either
// branch since the input array is the full new state.
async function runAiAndUpdateLink(
  linkId: string,
  url: string,
  title: string | null,
  content: string | null,
  description: string | null,
  onProgress?: (
    status: ProcessingStatus,
    data?: Record<string, unknown>,
  ) => void,
) {
  const db = getDb();
  const settings = await getAiSettings();

  if (!settings.ai_api_key) {
    logAiAnalysis(
      url,
      "error",
      undefined,
      undefined,
      "No AI API key configured",
    );
    db.transaction((tx) => {
      tx.update(schema.links)
        .set({
          aiTitle: title,
          aiSummary: description,
          aiKeyPoints: [],
          aiCategory: null,
          processingStatus: "completed",
          processError: null,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(schema.links.id, linkId))
        .run();
      // ai_tags = [] means "delete all ai_tag junction rows for this link".
      tx.delete(schema.linkAiTags)
        .where(eq(schema.linkAiTags.linkId, linkId))
        .run();
    });
    onProgress?.("completed", { title, summary: description });
    return;
  }

  const categoryRows = await db
    .select({ name: schema.categories.name })
    .from(schema.categories)
    .orderBy(schema.categories.name);
  const categoryNames = categoryRows.map((c) => c.name);

  const aiStart = Date.now();
  logAiAnalysis(url, "start", content || undefined);
  const aiResult = await analyzeLinkContent(
    settings,
    url,
    title,
    content,
    description,
    categoryNames,
  );

  db.transaction((tx) => {
    tx.update(schema.links)
      .set({
        aiTitle: aiResult.ai_title,
        aiSummary: aiResult.ai_summary,
        aiKeyPoints: aiResult.ai_key_points,
        aiCategory: aiResult.ai_category,
        processingStatus: "completed",
        processError: null,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(schema.links.id, linkId))
      .run();
    tx.delete(schema.linkAiTags)
      .where(eq(schema.linkAiTags.linkId, linkId))
      .run();
    if (aiResult.ai_tags.length > 0) {
      tx.insert(schema.linkAiTags)
        .values(aiResult.ai_tags.map((tag) => ({ linkId, tag })))
        .run();
    }
  });

  logAiAnalysis(
    url,
    "success",
    undefined,
    aiResult,
    undefined,
    Date.now() - aiStart,
  );
  onProgress?.("completed", {
    title: aiResult.ai_title,
    summary: aiResult.ai_summary,
    key_points: aiResult.ai_key_points,
    category: aiResult.ai_category,
    tags: aiResult.ai_tags,
  });
}

export async function processLinkAsync(
  linkId: string,
  onProgress?: (
    status: ProcessingStatus,
    data?: Record<string, unknown>,
  ) => void,
) {
  const db = getDb();
  try {
    // 1. Update to fetching
    db.update(schema.links)
      .set({
        processingStatus: "fetching",
        processError: null,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(schema.links.id, linkId))
      .run();
    onProgress?.("fetching");

    const link = await db
      .select({ url: schema.links.url })
      .from(schema.links)
      .where(eq(schema.links.id, linkId))
      .get();

    if (!link) throw new Error("Link not found");

    // 2. Scrape
    logScraping(link.url, "start");
    const scrapeStart = Date.now();
    const scrapeResult = await scrapeLinkWithJina(link.url);
    logScraping(
      link.url,
      "success",
      Date.now() - scrapeStart,
      scrapeResult.content?.length,
    );

    db.update(schema.links)
      .set({
        originalTitle: scrapeResult.title,
        originalDescription: scrapeResult.description,
        originalContent: scrapeResult.content,
        processingStatus: "analyzing",
        updatedAt: new Date().toISOString(),
      })
      .where(eq(schema.links.id, linkId))
      .run();
    onProgress?.("analyzing", {
      title: scrapeResult.title,
      description: scrapeResult.description,
    });

    // 3. AI Analysis
    await runAiAndUpdateLink(
      linkId,
      link.url,
      scrapeResult.title,
      scrapeResult.content,
      scrapeResult.description,
      onProgress,
    );
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    logError("Link processing failed", { error: err, linkId });
    db.update(schema.links)
      .set({
        processingStatus: "failed",
        processError: errorMessage,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(schema.links.id, linkId))
      .run();
    onProgress?.("failed", { error: errorMessage });
  }
}

export async function reprocessLink(linkId: string) {
  const db = getDb();
  const link = await db
    .select({
      url: schema.links.url,
      originalTitle: schema.links.originalTitle,
      originalDescription: schema.links.originalDescription,
      originalContent: schema.links.originalContent,
    })
    .from(schema.links)
    .where(eq(schema.links.id, linkId))
    .get();

  if (!link) throw new Error("Link not found");

  if (link.originalContent) {
    // Scraping already succeeded: skip to AI analysis only
    db.update(schema.links)
      .set({
        processingStatus: "analyzing",
        processError: null,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(schema.links.id, linkId))
      .run();

    runAiAndUpdateLink(
      linkId,
      link.url,
      link.originalTitle,
      link.originalContent,
      link.originalDescription,
    ).catch((err) => {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      logError("Reprocess AI-only failed", { error: err, linkId });
      db.update(schema.links)
        .set({
          processingStatus: "failed",
          processError: errorMessage,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(schema.links.id, linkId))
        .run();
    });
  } else {
    // Scraping not done: reset and run full pipeline
    db.update(schema.links)
      .set({
        processingStatus: "queued",
        processError: null,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(schema.links.id, linkId))
      .run();

    processLinkAsync(linkId).catch((err) =>
      logError("Reprocess full pipeline failed", { error: err, linkId }),
    );
  }
}

// ---------------------------------------------------------------------------
// Listing helpers
// ---------------------------------------------------------------------------

// Build the predicate list shared by getAdminLinks and getPendingLinks.
async function buildAdminLinkFilters(query: AdminLinksQuery): Promise<SQL[]> {
  const filters: SQL[] = [];

  if (query.status) {
    filters.push(eq(schema.links.status, query.status));
  } else {
    filters.push(ne(schema.links.status, "deleted"));
  }

  if (query.processing_status) {
    filters.push(eq(schema.links.processingStatus, query.processing_status));
  }

  if (query.q) {
    const pattern = `%${query.q}%`;
    const condition = or(
      like(schema.links.title, pattern),
      like(schema.links.url, pattern),
      like(schema.links.aiTitle, pattern),
    );
    if (condition) filters.push(condition);
  }

  if (query.category) {
    const categoryId = await getCategoryIdByName(query.category);
    // Legacy behaviour: if the category name does not resolve to an id, the
    // filter is silently dropped (returns all categories).
    if (categoryId) {
      filters.push(eq(schema.links.categoryId, categoryId));
    }
  }

  if (query.tags) {
    const tagList = query.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    if (tagList.length > 0) {
      filters.push(tagsOverlapFilter(tagList));
    }
  }

  return filters;
}

// ---------------------------------------------------------------------------
// Read paths
// ---------------------------------------------------------------------------

export async function getAdminLinks(query: AdminLinksQuery) {
  const page = query.page || 1;
  const pageSize = query.page_size || 20;
  const offset = (page - 1) * pageSize;
  const sortBy = query.sort_by || "created_at";
  const ascending = query.sort_order === "asc";

  const filters = await buildAdminLinkFilters(query);
  const where = filters.length === 0 ? undefined : and(...filters);

  const db = getDb();

  const [rows, countRows] = await Promise.all([
    db
      .select({
        link: schema.links,
        categoryName: schema.categories.name,
      })
      .from(schema.links)
      .leftJoin(
        schema.categories,
        eq(schema.links.categoryId, schema.categories.id),
      )
      .where(where)
      .orderBy(orderByLink(sortBy, ascending))
      .limit(pageSize)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(schema.links)
      .where(where),
  ]);

  const linkIds = rows.map((r) => r.link.id);
  const { tagsByLink, aiTagsByLink } = await fetchTagsForLinks(linkIds);

  const items = rows.map((r) =>
    mapLinkRow(r.link, {
      categoryName: r.categoryName,
      tags: tagsByLink.get(r.link.id) ?? [],
      aiTags: aiTagsByLink.get(r.link.id) ?? [],
    }),
  );

  const total = countRows[0]?.count ?? 0;

  return {
    items,
    pagination: {
      page,
      page_size: pageSize,
      total,
      total_pages: Math.ceil(total / pageSize),
    },
  };
}

export async function getPendingLinks(query: LinksQuery) {
  return getAdminLinks({ ...query, status: "pending" });
}

export async function getPublicLinks(query: LinksQuery) {
  const page = query.page || 1;
  const pageSize = query.page_size || 20;
  const offset = (page - 1) * pageSize;
  const sortBy = query.sort_by || "published_at";
  const ascending = query.sort_order === "asc";

  const filters: SQL[] = [eq(schema.links.status, "published")];

  if (query.q) {
    const pattern = `%${query.q}%`;
    const condition = or(
      like(schema.links.title, pattern),
      like(schema.links.summary, pattern),
      like(schema.links.url, pattern),
    );
    if (condition) filters.push(condition);
  }

  if (query.category) {
    const categoryId = await getCategoryIdByName(query.category);
    if (categoryId) filters.push(eq(schema.links.categoryId, categoryId));
  }

  if (query.tags) {
    const tagList = query.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    if (tagList.length > 0) filters.push(tagsOverlapFilter(tagList));
  }

  const where = and(...filters);
  const db = getDb();

  const [rows, countRows] = await Promise.all([
    db
      .select({
        id: schema.links.id,
        url: schema.links.url,
        title: schema.links.title,
        summary: schema.links.summary,
        key_points: schema.links.keyPoints,
        published_at: schema.links.publishedAt,
        category_id: schema.links.categoryId,
        categoryName: schema.categories.name,
      })
      .from(schema.links)
      .leftJoin(
        schema.categories,
        eq(schema.links.categoryId, schema.categories.id),
      )
      .where(where)
      .orderBy(orderByLink(sortBy, ascending))
      .limit(pageSize)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(schema.links)
      .where(where),
  ]);

  const linkIds = rows.map((r) => r.id);
  const { tagsByLink } = await fetchTagsForLinks(linkIds);

  const items = rows.map((row) => ({
    id: row.id,
    url: row.url,
    title: row.title,
    summary: row.summary,
    key_points: row.key_points,
    category: row.categoryName,
    tags: tagsByLink.get(row.id) ?? [],
    domain: extractDomain(row.url),
    published_at: row.published_at,
  }));

  // Aggregation: tags and categories for ALL published links (not filtered).
  // Compute counts in SQL to avoid loading every published row into JS.
  const tagCountsRows = await db
    .select({
      tag: schema.linkTags.tag,
      count: sql<number>`count(*)`,
    })
    .from(schema.linkTags)
    .innerJoin(schema.links, eq(schema.links.id, schema.linkTags.linkId))
    .where(eq(schema.links.status, "published"))
    .groupBy(schema.linkTags.tag);

  const catCountsRows = await db
    .select({
      id: schema.links.categoryId,
      count: sql<number>`count(*)`,
    })
    .from(schema.links)
    .where(
      and(
        eq(schema.links.status, "published"),
        isNotNull(schema.links.categoryId),
      ),
    )
    .groupBy(schema.links.categoryId);

  const tagsAgg = tagCountsRows
    .map((r) => ({ name: r.tag, count: r.count }))
    .sort((a, b) => b.count - a.count);

  const categoriesAgg = catCountsRows
    .filter((r): r is { id: string; count: number } => r.id !== null)
    .map((r) => ({ id: r.id, count: r.count }))
    .sort((a, b) => b.count - a.count);

  const total = countRows[0]?.count ?? 0;

  return {
    items,
    tags: tagsAgg,
    categories: categoriesAgg,
    pagination: {
      page,
      page_size: pageSize,
      total,
      total_pages: Math.ceil(total / pageSize),
    },
  };
}

export async function getAuthLinks(query: AdminLinksQuery, createdBy: string) {
  const page = query.page || 1;
  const pageSize = query.page_size || 20;
  const offset = (page - 1) * pageSize;
  const sortBy = query.sort_by || "created_at";
  const ascending = query.sort_order === "asc";

  const filters: SQL[] = [eq(schema.links.createdBy, createdBy)];

  if (query.status) {
    filters.push(eq(schema.links.status, query.status));
  } else {
    filters.push(ne(schema.links.status, "deleted"));
  }

  if (query.processing_status) {
    filters.push(eq(schema.links.processingStatus, query.processing_status));
  }

  if (query.q) {
    const pattern = `%${query.q}%`;
    const condition = or(
      like(schema.links.title, pattern),
      like(schema.links.summary, pattern),
      like(schema.links.aiTitle, pattern),
      like(schema.links.aiSummary, pattern),
      like(schema.links.url, pattern),
    );
    if (condition) filters.push(condition);
  }

  if (query.category) {
    const categoryId = await getCategoryIdByName(query.category);
    if (categoryId) filters.push(eq(schema.links.categoryId, categoryId));
  }

  if (query.tags) {
    const tagList = query.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    if (tagList.length > 0) filters.push(tagsOverlapFilter(tagList));
  }

  const where = and(...filters);
  const db = getDb();

  const [rows, countRows] = await Promise.all([
    db
      .select({
        id: schema.links.id,
        url: schema.links.url,
        status: schema.links.status,
        processing_status: schema.links.processingStatus,
        title: schema.links.title,
        summary: schema.links.summary,
        key_points: schema.links.keyPoints,
        ai_title: schema.links.aiTitle,
        ai_summary: schema.links.aiSummary,
        ai_key_points: schema.links.aiKeyPoints,
        created_at: schema.links.createdAt,
        published_at: schema.links.publishedAt,
        category_id: schema.links.categoryId,
        categoryName: schema.categories.name,
      })
      .from(schema.links)
      .leftJoin(
        schema.categories,
        eq(schema.links.categoryId, schema.categories.id),
      )
      .where(where)
      .orderBy(orderByLink(sortBy, ascending))
      .limit(pageSize)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(schema.links)
      .where(where),
  ]);

  const linkIds = rows.map((r) => r.id);
  const { tagsByLink } = await fetchTagsForLinks(linkIds);

  const items = rows.map((row) => ({
    id: row.id,
    url: row.url,
    status: row.status,
    processing_status: row.processing_status,
    title: row.title || row.ai_title,
    summary: row.summary || row.ai_summary,
    key_points:
      row.key_points && row.key_points.length > 0
        ? row.key_points
        : (row.ai_key_points ?? []),
    category: row.categoryName,
    tags: tagsByLink.get(row.id) ?? [],
    domain: extractDomain(row.url),
    created_at: row.created_at,
    published_at: row.published_at,
  }));

  // Tag/category aggregation across all of this user's non-deleted links.
  const visibleScope = and(
    eq(schema.links.createdBy, createdBy),
    ne(schema.links.status, "deleted"),
  );

  const tagCountsRows = await db
    .select({
      tag: schema.linkTags.tag,
      count: sql<number>`count(*)`,
    })
    .from(schema.linkTags)
    .innerJoin(schema.links, eq(schema.links.id, schema.linkTags.linkId))
    .where(visibleScope)
    .groupBy(schema.linkTags.tag);

  const catCountsRows = await db
    .select({
      id: schema.links.categoryId,
      count: sql<number>`count(*)`,
    })
    .from(schema.links)
    .where(and(visibleScope, isNotNull(schema.links.categoryId)))
    .groupBy(schema.links.categoryId);

  const tagsAgg = tagCountsRows
    .map((r) => ({ name: r.tag, count: r.count }))
    .sort((a, b) => b.count - a.count);

  const categoriesAgg = catCountsRows
    .filter((r): r is { id: string; count: number } => r.id !== null)
    .map((r) => ({ id: r.id, count: r.count }))
    .sort((a, b) => b.count - a.count);

  const total = countRows[0]?.count ?? 0;

  return {
    items,
    tags: tagsAgg,
    categories: categoriesAgg,
    pagination: {
      page,
      page_size: pageSize,
      total,
      total_pages: Math.ceil(total / pageSize),
    },
  };
}

export async function getLinkById(id: string, createdBy?: string) {
  const db = getDb();
  const conditions: SQL[] = [eq(schema.links.id, id)];
  if (createdBy) conditions.push(eq(schema.links.createdBy, createdBy));

  const row = await db
    .select({
      link: schema.links,
      categoryName: schema.categories.name,
    })
    .from(schema.links)
    .leftJoin(
      schema.categories,
      eq(schema.links.categoryId, schema.categories.id),
    )
    .where(and(...conditions))
    .get();

  if (!row) return null;

  const { tags, aiTags } = await fetchTagsForLink(row.link.id);
  return mapLinkRow(row.link, {
    categoryName: row.categoryName,
    tags,
    aiTags,
  });
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export async function updateLink(
  id: string,
  updates: {
    title?: string;
    summary?: string;
    key_points?: string[];
    category?: string;
    tags?: string[];
  },
) {
  const db = getDb();
  const dbUpdates: Partial<typeof schema.links.$inferInsert> = {
    updatedAt: new Date().toISOString(),
  };

  if (updates.title !== undefined) dbUpdates.title = updates.title;
  if (updates.summary !== undefined) dbUpdates.summary = updates.summary;
  if (updates.key_points !== undefined)
    dbUpdates.keyPoints = updates.key_points;

  if (updates.category !== undefined) {
    if (updates.category) {
      dbUpdates.categoryId = await getCategoryIdByName(updates.category);
    } else {
      dbUpdates.categoryId = null;
    }
  }

  db.transaction((tx) => {
    tx.update(schema.links).set(dbUpdates).where(eq(schema.links.id, id)).run();

    if (updates.tags !== undefined) {
      tx.delete(schema.linkTags).where(eq(schema.linkTags.linkId, id)).run();
      if (updates.tags.length > 0) {
        tx.insert(schema.linkTags)
          .values(updates.tags.map((tag) => ({ linkId: id, tag })))
          .run();
      }
    }
  });

  const result = await getLinkById(id);
  if (!result) throw new Error("Link not found");
  return result;
}

export async function publishLink(id: string) {
  const db = getDb();
  const existing = await db
    .select({
      id: schema.links.id,
      title: schema.links.title,
      summary: schema.links.summary,
      categoryId: schema.links.categoryId,
    })
    .from(schema.links)
    .where(eq(schema.links.id, id))
    .get();

  if (!existing) throw new Error("Link not found");

  const tagRows = await db
    .select({ tag: schema.linkTags.tag })
    .from(schema.linkTags)
    .where(eq(schema.linkTags.linkId, id));
  const tags = tagRows.map((r) => r.tag);

  const validationMessage = getPublishValidationMessage({
    title: existing.title,
    summary: existing.summary,
    category_id: existing.categoryId,
    tags,
  });
  if (validationMessage) {
    throw new LinkValidationError(validationMessage);
  }

  const now = new Date().toISOString();
  db.update(schema.links)
    .set({
      status: "published",
      publishedAt: now,
      updatedAt: now,
    })
    .where(eq(schema.links.id, id))
    .run();

  const result = await getLinkById(id);
  if (!result) throw new Error("Link not found");
  return result;
}

export async function archiveLink(id: string) {
  const db = getDb();
  const updated = db
    .update(schema.links)
    .set({
      status: "archived",
      updatedAt: new Date().toISOString(),
    })
    .where(eq(schema.links.id, id))
    .returning()
    .get();

  if (!updated) throw new Error("Link not found");
  // Re-hydrate via getLinkById to populate tags/ai_tags/category in the
  // returned wire-shape, matching publishLink/updateLink behaviour.
  const result = await getLinkById(id);
  if (!result) throw new Error("Link not found");
  return result;
}

export async function deleteLink(id: string) {
  const db = getDb();
  db.update(schema.links)
    .set({ status: "deleted", updatedAt: new Date().toISOString() })
    .where(eq(schema.links.id, id))
    .run();
}

export async function batchPublish(ids: string[]) {
  if (ids.length === 0) return;
  const db = getDb();
  const now = new Date().toISOString();
  db.update(schema.links)
    .set({ status: "published", publishedAt: now, updatedAt: now })
    .where(inArray(schema.links.id, ids))
    .run();
}

export async function batchDelete(ids: string[]) {
  if (ids.length === 0) return;
  const db = getDb();
  db.update(schema.links)
    .set({ status: "deleted", updatedAt: new Date().toISOString() })
    .where(inArray(schema.links.id, ids))
    .run();
}

export async function getPublishedLinksForFeed(limit = 50) {
  const db = getDb();
  const rows = await db
    .select({
      id: schema.links.id,
      url: schema.links.url,
      title: schema.links.title,
      summary: schema.links.summary,
      published_at: schema.links.publishedAt,
      category_id: schema.links.categoryId,
      categoryName: schema.categories.name,
    })
    .from(schema.links)
    .leftJoin(
      schema.categories,
      eq(schema.links.categoryId, schema.categories.id),
    )
    .where(eq(schema.links.status, "published"))
    .orderBy(sql`${schema.links.publishedAt} DESC NULLS LAST`)
    .limit(limit);

  const linkIds = rows.map((r) => r.id);
  const { tagsByLink } = await fetchTagsForLinks(linkIds);

  return rows.map((row) => ({
    id: row.id,
    url: row.url,
    title: row.title,
    summary: row.summary,
    tags: tagsByLink.get(row.id) ?? [],
    category: row.categoryName,
    published_at: row.published_at,
  }));
}

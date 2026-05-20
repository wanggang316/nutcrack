import { randomUUID } from "node:crypto";

import { eq } from "drizzle-orm";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

// IMPORTANT: set DATABASE_URL BEFORE importing @nutcrack/db so the cached
// singleton points at a fresh in-memory database for this test file.
process.env.DATABASE_URL = ":memory:";

// Hoisted mocks for external collaborators. The links service depends on
// scraping, AI analysis, AI settings, and the logger; the DB itself uses a
// real in-memory SQLite instance.
const mocks = vi.hoisted(() => ({
  scrapeUrlWithJinaMock: vi.fn(),
  analyzeContentMock: vi.fn(),
  getAiSettingsMock: vi.fn(),
  logAiAnalysisMock: vi.fn(),
  logErrorMock: vi.fn(),
  logScrapingMock: vi.fn(),
}));

vi.mock("../services/link-scrape.js", () => ({
  scrapeLinkWithJina: mocks.scrapeUrlWithJinaMock,
}));

vi.mock("../services/link-analyze.js", () => ({
  analyzeLinkContent: mocks.analyzeContentMock,
}));

vi.mock("../services/settings.js", () => ({
  getAiSettings: mocks.getAiSettingsMock,
}));

vi.mock("../lib/logger.js", () => ({
  logAiAnalysis: mocks.logAiAnalysisMock,
  logError: mocks.logErrorMock,
  logScraping: mocks.logScrapingMock,
}));

const { runMigrations, getDb, schema } = await import("@nutcrack/db");
const {
  LinkValidationError,
  archiveLink,
  getAdminLinks,
  processLinkAsync,
  publishLink,
} = await import("../services/links.js");

const TEST_USER_ID = "user-links-test";
const TEST_CATEGORY_ID = "cat-links-test";
const TEST_CATEGORY_NAME = "技术";

beforeAll(() => {
  runMigrations();
});

beforeEach(async () => {
  const db = getDb();
  // FK-cascade ordering: junctions and child tables first.
  await db.delete(schema.linkAiTags);
  await db.delete(schema.linkTags);
  await db.delete(schema.links);
  await db.delete(schema.categories);
  await db.delete(schema.users);

  await db.insert(schema.users).values({
    id: TEST_USER_ID,
    email: "links-test@example.com",
    passwordHash: "x",
  });

  await db.insert(schema.categories).values({
    id: TEST_CATEGORY_ID,
    name: TEST_CATEGORY_NAME,
    slug: "tech",
  });

  vi.clearAllMocks();
});

async function seedLink(
  overrides: Partial<{
    id: string;
    url: string;
    title: string | null;
    summary: string | null;
    categoryId: string | null;
    status: "pending" | "published" | "archived" | "deleted";
    processingStatus:
      | "queued"
      | "fetching"
      | "analyzing"
      | "completed"
      | "failed";
  }> = {},
) {
  const db = getDb();
  const id = overrides.id ?? randomUUID();
  await db.insert(schema.links).values({
    id,
    url: overrides.url ?? `https://example.com/${id}`,
    title: overrides.title ?? null,
    summary: overrides.summary ?? null,
    categoryId: overrides.categoryId ?? null,
    status: overrides.status ?? "pending",
    processingStatus: overrides.processingStatus ?? "queued",
    createdBy: TEST_USER_ID,
  });
  return id;
}

async function readLink(id: string) {
  const db = getDb();
  return db.select().from(schema.links).where(eq(schema.links.id, id)).get();
}

async function readAiTags(id: string) {
  const db = getDb();
  const rows = await db
    .select({ tag: schema.linkAiTags.tag })
    .from(schema.linkAiTags)
    .where(eq(schema.linkAiTags.linkId, id));
  return rows.map((r) => r.tag).sort();
}

describe("link services", () => {
  it("processes a link with jina scrape and AI analysis", async () => {
    const linkId = await seedLink({ url: "https://example.com/post" });
    const progress: Array<{ status: string; data?: Record<string, unknown> }> =
      [];

    mocks.scrapeUrlWithJinaMock.mockResolvedValue({
      title: "Original title",
      description: null,
      content: "Original content",
    });
    mocks.getAiSettingsMock.mockResolvedValue({
      ai_api_base_url: "https://example.ai/v1",
      ai_api_key: "secret",
      ai_model: "gpt-test",
      ai_temperature: 0.2,
    });
    mocks.analyzeContentMock.mockResolvedValue({
      ai_title: "AI title",
      ai_summary: "AI summary",
      ai_key_points: ["A", "B"],
      ai_category: TEST_CATEGORY_NAME,
      ai_tags: ["AI", "InboxLM"],
    });

    await processLinkAsync(linkId, (status, data) => {
      progress.push({ status, data });
    });

    expect(mocks.scrapeUrlWithJinaMock).toHaveBeenCalledWith(
      "https://example.com/post",
    );
    expect(mocks.analyzeContentMock).toHaveBeenCalledWith(
      expect.objectContaining({
        ai_api_key: "secret",
        ai_model: "gpt-test",
      }),
      "https://example.com/post",
      "Original title",
      "Original content",
      null,
      [TEST_CATEGORY_NAME],
    );

    const finalRow = await readLink(linkId);
    expect(finalRow).toMatchObject({
      originalTitle: "Original title",
      originalContent: "Original content",
      aiTitle: "AI title",
      aiSummary: "AI summary",
      aiKeyPoints: ["A", "B"],
      aiCategory: TEST_CATEGORY_NAME,
      processingStatus: "completed",
      processError: null,
    });
    expect(await readAiTags(linkId)).toEqual(["AI", "InboxLM"]);

    expect(progress.map((item) => item.status)).toEqual([
      "fetching",
      "analyzing",
      "completed",
    ]);
  });

  it("falls back to scrape result when AI key is missing", async () => {
    const linkId = await seedLink({ url: "https://example.com/fallback" });

    mocks.scrapeUrlWithJinaMock.mockResolvedValue({
      title: "Fallback title",
      description: "Fallback description",
      content: "Fallback content",
    });
    mocks.getAiSettingsMock.mockResolvedValue({
      ai_api_base_url: "https://example.ai/v1",
      ai_api_key: "",
      ai_model: "gpt-test",
      ai_temperature: 0.2,
    });

    await processLinkAsync(linkId);

    expect(mocks.analyzeContentMock).not.toHaveBeenCalled();
    const finalRow = await readLink(linkId);
    expect(finalRow).toMatchObject({
      aiTitle: "Fallback title",
      aiSummary: "Fallback description",
      aiKeyPoints: [],
      aiCategory: null,
      processingStatus: "completed",
    });
    expect(await readAiTags(linkId)).toEqual([]);
  });

  it("marks the link as failed when scraping throws", async () => {
    const linkId = await seedLink({ url: "https://example.com/error" });
    const progress: Array<{ status: string; data?: Record<string, unknown> }> =
      [];

    mocks.scrapeUrlWithJinaMock.mockRejectedValue(new Error("Jina timeout"));

    await processLinkAsync(linkId, (status, data) => {
      progress.push({ status, data });
    });

    const finalRow = await readLink(linkId);
    expect(finalRow).toMatchObject({
      processingStatus: "failed",
      processError: "Jina timeout",
    });
    expect(progress.at(-1)).toEqual({
      status: "failed",
      data: { error: "Jina timeout" },
    });
    expect(mocks.logErrorMock).toHaveBeenCalledWith(
      "Link processing failed",
      expect.objectContaining({ linkId }),
    );
  });

  it("archives a link and returns its tags and category", async () => {
    const linkId = await seedLink({
      title: "Manual title",
      summary: "Manual summary",
      categoryId: TEST_CATEGORY_ID,
      status: "published",
    });
    const db = getDb();
    await db.insert(schema.linkTags).values([
      { linkId, tag: "a" },
      { linkId, tag: "b" },
    ]);
    await db.insert(schema.linkAiTags).values({ linkId, tag: "ai-x" });

    const result = await archiveLink(linkId);

    expect(result.status).toBe("archived");
    expect(result.tags).toEqual(expect.arrayContaining(["a", "b"]));
    expect(result.tags).toHaveLength(2);
    expect(result.ai_tags).toEqual(["ai-x"]);
    expect(result.category).toBe(TEST_CATEGORY_NAME);
    // category_id must not leak into the mapped wire-shape.
    expect(result).not.toHaveProperty("category_id");
  });

  it("filters admin links by overlapping tags using a multi-value query", async () => {
    // Regression for the previous `IN ${array}` bug: better-sqlite3 cannot
    // bind a JS array to a single placeholder. Exercising the multi-tag path
    // ensures the filter expands placeholders correctly.
    const linkA = await seedLink({ url: "https://example.com/a" });
    const linkB = await seedLink({ url: "https://example.com/b" });
    const db = getDb();
    await db.insert(schema.linkTags).values([
      { linkId: linkA, tag: "alpha" },
      { linkId: linkA, tag: "beta" },
      { linkId: linkA, tag: "gamma" },
      { linkId: linkB, tag: "delta" },
    ]);

    const onlyA = await getAdminLinks({ tags: "alpha,beta" });
    expect(onlyA.items.map((item) => item.id).sort()).toEqual([linkA].sort());

    const both = await getAdminLinks({ tags: "alpha,delta" });
    expect(both.items.map((item) => item.id).sort()).toEqual(
      [linkA, linkB].sort(),
    );
  });

  it("prevents publishing links with incomplete manual fields", async () => {
    // Manual title + category + tags are present but summary is missing.
    const linkId = await seedLink({
      title: "Manual title",
      summary: null,
      categoryId: TEST_CATEGORY_ID,
    });
    const db = getDb();
    await db.insert(schema.linkTags).values({ linkId, tag: "AI" });

    await expect(publishLink(linkId)).rejects.toThrow(LinkValidationError);
  });
});

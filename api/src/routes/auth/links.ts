import { Hono } from "hono";
import {
  LinkStatus,
  ProcessingStatus,
  type AdminLinksQuery,
} from "@nutcrack/shared";
import { validateScrapeUrl } from "@nutcrack/scrape";
import type { AppVariables } from "../../types.js";
import { createLink, getAuthLinks, getLinkById } from "../../services/links.js";
import { successResponse, errorResponse } from "../../lib/utils.js";
import { logError } from "../../lib/logger.js";

const app = new Hono<{ Variables: AppVariables }>();

// GET /api/auth/links - Query links created by current token
app.get("/", async (c) => {
  try {
    const createdBy = c.get("tokenCreatedBy");
    const status = c.req.query("status");
    const processingStatus = c.req.query("processing_status");
    const sortOrder = c.req.query("sort_order");

    const query: AdminLinksQuery = {
      page: c.req.query("page") ? Number(c.req.query("page")) : undefined,
      page_size: c.req.query("page_size")
        ? Number(c.req.query("page_size"))
        : undefined,
      q: c.req.query("q") || undefined,
      category: c.req.query("category") || undefined,
      tags: c.req.query("tags") || undefined,
      status:
        status && Object.values(LinkStatus).includes(status as never)
          ? (status as AdminLinksQuery["status"])
          : undefined,
      processing_status:
        processingStatus &&
        Object.values(ProcessingStatus).includes(processingStatus as never)
          ? (processingStatus as AdminLinksQuery["processing_status"])
          : undefined,
      sort_by: c.req.query("sort_by") || undefined,
      sort_order: sortOrder === "asc" ? "asc" : "desc",
    };

    const result = await getAuthLinks(query, createdBy);
    return c.json(successResponse(result));
  } catch (err) {
    logError("External list links error", { error: err });
    return c.json(
      errorResponse("INTERNAL_ERROR", "Failed to fetch links"),
      500,
    );
  }
});

// POST /api/auth/links - External single link creation
app.post("/", async (c) => {
  try {
    const body = await c.req.json();
    const url = body.url;

    if (!url) {
      return c.json(errorResponse("VALIDATION_ERROR", "url is required"), 400);
    }

    try {
      validateScrapeUrl(url);
    } catch (err) {
      return c.json(
        errorResponse(
          "VALIDATION_ERROR",
          err instanceof Error ? err.message : "Invalid URL",
        ),
        400,
      );
    }

    const createdBy = c.get("tokenCreatedBy");
    const link = await createLink(url, createdBy);

    // If tags provided, they'll be merged during AI analysis
    return c.json(
      successResponse({
        id: link.id,
        url: link.url,
        status: link.status,
        processing_status: link.processing_status,
        created_at: link.created_at,
      }),
      201,
    );
  } catch (err) {
    logError("External create link error", { error: err });
    return c.json(
      errorResponse("INTERNAL_ERROR", "Failed to create link"),
      500,
    );
  }
});

// POST /api/auth/links/batch - External batch link creation
app.post("/batch", async (c) => {
  try {
    const body = await c.req.json();
    const urls = body.urls;

    if (!Array.isArray(urls) || urls.length === 0) {
      return c.json(
        errorResponse("VALIDATION_ERROR", "urls array is required"),
        400,
      );
    }

    if (urls.length > 50) {
      return c.json(
        errorResponse("VALIDATION_ERROR", "Maximum 50 urls per batch"),
        400,
      );
    }

    const createdBy = c.get("tokenCreatedBy");
    const results = [];

    for (const url of urls) {
      try {
        validateScrapeUrl(url);
        const link = await createLink(url, createdBy);
        results.push({
          url,
          id: link.id,
          status: "created",
        });
      } catch (err) {
        results.push({
          url,
          id: null,
          status: "failed",
          error: err instanceof Error ? err.message : "Invalid URL",
        });
      }
    }

    return c.json(successResponse({ items: results }), 201);
  } catch (err) {
    logError("External batch create error", { error: err });
    return c.json(
      errorResponse("INTERNAL_ERROR", "Failed to batch create links"),
      500,
    );
  }
});

// GET /api/auth/links/:id - Query external created link
app.get("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const createdBy = c.get("tokenCreatedBy");
    const link = await getLinkById(id, createdBy);
    if (!link) {
      return c.json(errorResponse("NOT_FOUND", "Link not found"), 404);
    }
    return c.json(
      successResponse({
        id: link.id,
        url: link.url,
        status: link.status,
        processing_status: link.processing_status,
        title: link.title || link.ai_title,
        summary: link.summary || link.ai_summary,
        created_at: link.created_at,
      }),
    );
  } catch (err) {
    logError("External get link error", { error: err });
    return c.json(errorResponse("INTERNAL_ERROR", "Failed to fetch link"), 500);
  }
});

export default app;

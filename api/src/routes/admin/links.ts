import { randomUUID } from "node:crypto";
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { getDb, schema } from "@nutcrack/db";
import type { AppVariables } from "../../types.js";
import {
  getAdminLinks,
  getPendingLinks,
  LinkValidationError,
  getLinkById,
  createLink,
  updateLink,
  publishLink,
  archiveLink,
  deleteLink,
  batchPublish,
  batchDelete,
  processLinkAsync,
  reprocessLink,
} from "../../services/links.js";
import { successResponse, errorResponse } from "../../lib/utils.js";
import { logError } from "../../lib/logger.js";
import { createLinkSchema } from "../../lib/validation.js";
import type { AdminLinksQuery } from "@nutcrack/shared";

const app = new Hono<{ Variables: AppVariables }>();

// GET /api/admin/links
app.get("/", async (c) => {
  try {
    const query: AdminLinksQuery = {
      page: Number(c.req.query("page")) || 1,
      page_size: Number(c.req.query("page_size")) || 20,
      q: c.req.query("q"),
      status: c.req.query("status") as AdminLinksQuery["status"],
      processing_status: c.req.query(
        "processing_status",
      ) as AdminLinksQuery["processing_status"],
      category: c.req.query("category"),
      tags: c.req.query("tags"),
      sort_by: c.req.query("sort_by") || "created_at",
      sort_order: (c.req.query("sort_order") as "asc" | "desc") || "desc",
    };

    const result = await getAdminLinks(query);
    return c.json(successResponse(result));
  } catch (err) {
    logError("Admin links error", { error: err });
    return c.json(
      errorResponse("INTERNAL_ERROR", "Failed to fetch links"),
      500,
    );
  }
});

// POST /api/admin/links
app.post("/", zValidator("json", createLinkSchema), async (c) => {
  const { url } = c.req.valid("json");
  const userId = c.get("userId");
  const link = await createLink(url, userId);
  return c.json(successResponse(link), 201);
});

// SSE POST /api/admin/links/stream
app.post("/stream", async (c) => {
  const { url } = await c.req.json();
  if (!url) {
    return c.json(errorResponse("VALIDATION_ERROR", "url is required"), 400);
  }

  try {
    new URL(url);
  } catch {
    return c.json(errorResponse("VALIDATION_ERROR", "Invalid URL format"), 400);
  }

  const userId = c.get("userId");

  // Create link first. We insert the row inline (instead of going through the
  // `createLink` service) so we can drive `processLinkAsync` with an
  // onProgress callback for SSE — `createLink` only spawns processing in
  // fire-and-forget mode.
  let link: typeof schema.links.$inferSelect;
  try {
    const db = getDb();
    link = db
      .insert(schema.links)
      .values({
        id: randomUUID(),
        url,
        status: "pending",
        processingStatus: "queued",
        createdBy: userId,
      })
      .returning()
      .get();
  } catch (err) {
    logError("Create link error", { error: err, url });
    return c.json(
      errorResponse("INTERNAL_ERROR", "Failed to create link"),
      500,
    );
  }

  // Create a ReadableStream for SSE
  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (type: string, data: Record<string, unknown>) => {
        const event = `data: ${JSON.stringify({ type, link_id: link.id, ...data })}\n\n`;
        controller.enqueue(new TextEncoder().encode(event));
      };

      try {
        // Initial queued event
        sendEvent("queued", { data: { url: link.url } });

        // Process link with progress callbacks
        await processLinkAsync(link.id, (status, info) => {
          if (status === "fetching") {
            sendEvent("fetching", { message: "正在抓取网页内容..." });
          } else if (status === "analyzing") {
            sendEvent("analyzing", {
              message: "正在使用 AI 分析内容...",
              data: { title: info?.title, description: info?.description },
            });
          } else if (status === "completed") {
            sendEvent("completed", {
              message: "处理完成",
              data: {
                url: link.url,
                title: info?.title,
                summary: info?.summary,
                key_points: info?.key_points,
                category: info?.category,
                tags: info?.tags,
              },
            });
          } else if (status === "failed") {
            sendEvent("failed", {
              message: "处理失败",
              data: { error: info?.error },
            });
          }
        });

        controller.close();
      } catch (err) {
        logError("Stream error", { error: err, linkId: link.id });
        sendEvent("failed", {
          message: "处理失败",
          data: { error: err instanceof Error ? err.message : "Unknown error" },
        });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
});

// GET /api/admin/links/:id
app.get("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const link = await getLinkById(id);
    if (!link) {
      return c.json(errorResponse("NOT_FOUND", "Link not found"), 404);
    }
    return c.json(successResponse(link));
  } catch (err) {
    logError("Get link error", { error: err });
    return c.json(errorResponse("INTERNAL_ERROR", "Failed to fetch link"), 500);
  }
});

// PATCH /api/admin/links/:id
app.patch("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    const link = await updateLink(id, body);
    return c.json(successResponse(link));
  } catch (err) {
    logError("Update link error", { error: err });
    return c.json(
      errorResponse("INTERNAL_ERROR", "Failed to update link"),
      500,
    );
  }
});

// DELETE /api/admin/links/:id
app.delete("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    await deleteLink(id);
    return c.body(null, 204);
  } catch (err) {
    logError("Delete link error", { error: err });
    return c.json(
      errorResponse("INTERNAL_ERROR", "Failed to delete link"),
      500,
    );
  }
});

// POST /api/admin/links/:id/publish
app.post("/:id/publish", async (c) => {
  try {
    const id = c.req.param("id");
    const link = await publishLink(id);
    return c.json(successResponse(link));
  } catch (err) {
    if (err instanceof LinkValidationError) {
      return c.json(errorResponse("VALIDATION_ERROR", err.message), 400);
    }
    logError("Publish link error", { error: err });
    return c.json(
      errorResponse("INTERNAL_ERROR", "Failed to publish link"),
      500,
    );
  }
});

// POST /api/admin/links/:id/archive
app.post("/:id/archive", async (c) => {
  try {
    const id = c.req.param("id");
    const link = await archiveLink(id);
    return c.json(successResponse(link));
  } catch (err) {
    logError("Archive link error", { error: err });
    return c.json(
      errorResponse("INTERNAL_ERROR", "Failed to archive link"),
      500,
    );
  }
});

// POST /api/admin/links/:id/reprocess
app.post("/:id/reprocess", async (c) => {
  try {
    const id = c.req.param("id");
    await reprocessLink(id);
    return c.json(successResponse({ id, processing_status: "queued" }));
  } catch (err) {
    logError("Reprocess link error", { error: err });
    return c.json(
      errorResponse("INTERNAL_ERROR", "Failed to reprocess link"),
      500,
    );
  }
});

// POST /api/admin/links/batch/publish
app.post("/batch/publish", async (c) => {
  try {
    const { ids } = await c.req.json();
    if (!Array.isArray(ids) || ids.length === 0) {
      return c.json(
        errorResponse("VALIDATION_ERROR", "ids array is required"),
        400,
      );
    }
    await batchPublish(ids);
    return c.json(successResponse({ message: "Batch publish completed" }));
  } catch (err) {
    logError("Batch publish error", { error: err });
    return c.json(
      errorResponse("INTERNAL_ERROR", "Failed to batch publish"),
      500,
    );
  }
});

// POST /api/admin/links/batch/delete
app.post("/batch/delete", async (c) => {
  try {
    const { ids } = await c.req.json();
    if (!Array.isArray(ids) || ids.length === 0) {
      return c.json(
        errorResponse("VALIDATION_ERROR", "ids array is required"),
        400,
      );
    }
    await batchDelete(ids);
    return c.json(successResponse({ message: "Batch delete completed" }));
  } catch (err) {
    logError("Batch delete error", { error: err });
    return c.json(
      errorResponse("INTERNAL_ERROR", "Failed to batch delete"),
      500,
    );
  }
});

export default app;

import { Hono } from "hono";
import { getPendingLinks } from "../../services/links.js";
import { successResponse, errorResponse } from "../../lib/utils.js";
import { logError } from "../../lib/logger.js";

const app = new Hono();

// GET /api/admin/pending-links
app.get("/", async (c) => {
  try {
    const query = {
      page: Number(c.req.query("page")) || 1,
      page_size: Number(c.req.query("page_size")) || 20,
      q: c.req.query("q"),
      sort_by: c.req.query("sort_by") || "created_at",
      sort_order: (c.req.query("sort_order") as "asc" | "desc") || "desc",
    };

    const result = await getPendingLinks(query);
    return c.json(successResponse(result));
  } catch (err) {
    logError("Pending links error", { error: err });
    return c.json(
      errorResponse("INTERNAL_ERROR", "Failed to fetch pending links"),
      500,
    );
  }
});

export default app;

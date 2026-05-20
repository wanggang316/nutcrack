import { Hono } from "hono";
import { getPublicLinks } from "../../services/links.js";
import { successResponse, errorResponse } from "../../lib/utils.js";
import { logError } from "../../lib/logger.js";

const app = new Hono();

// GET /api/links
app.get("/", async (c) => {
  try {
    const query = {
      page: Number(c.req.query("page")) || 1,
      page_size: Number(c.req.query("page_size")) || 20,
      q: c.req.query("q"),
      category: c.req.query("category"),
      tags: c.req.query("tags"),
      sort_by: c.req.query("sort_by") || "published_at",
      sort_order: (c.req.query("sort_order") as "asc" | "desc") || "desc",
    };

    const result = await getPublicLinks(query);
    return c.json(successResponse(result));
  } catch (err) {
    logError("Public links error", { error: err });
    return c.json(
      errorResponse("INTERNAL_ERROR", "Failed to fetch links"),
      500,
    );
  }
});

export default app;

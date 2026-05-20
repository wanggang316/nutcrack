import { Hono } from "hono";
import { getCategories } from "../../services/categories.js";
import { successResponse, errorResponse } from "../../lib/utils.js";
import { logError } from "../../lib/logger.js";

const app = new Hono();

// GET /api/categories
app.get("/", async (c) => {
  try {
    const items = await getCategories();
    return c.json(successResponse({ items }));
  } catch (err) {
    logError("Public categories error", { error: err });
    return c.json(
      errorResponse("INTERNAL_ERROR", "Failed to fetch categories"),
      500,
    );
  }
});

export default app;

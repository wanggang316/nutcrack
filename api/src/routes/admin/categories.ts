import { Hono } from "hono";
import * as categoriesService from "../../services/categories.js";
import { successResponse, errorResponse } from "../../lib/utils.js";
import { logError } from "../../lib/logger.js";

const app = new Hono();

// GET /api/admin/categories
app.get("/", async (c) => {
  try {
    const items = await categoriesService.getCategories();
    return c.json(successResponse({ items }));
  } catch (err) {
    logError("Admin categories error", { error: err });
    return c.json(
      errorResponse("INTERNAL_ERROR", "Failed to fetch categories"),
      500,
    );
  }
});

// POST /api/admin/categories
app.post("/", async (c) => {
  try {
    const body = await c.req.json();
    if (!body.name) {
      return c.json(errorResponse("VALIDATION_ERROR", "name is required"), 400);
    }
    const category = await categoriesService.createCategory(body);
    return c.json(successResponse(category), 201);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.startsWith("CONFLICT:")) {
      return c.json(errorResponse("CONFLICT", message.slice(9)), 409);
    }
    logError("Create category error", { error: err });
    return c.json(
      errorResponse("INTERNAL_ERROR", "Failed to create category"),
      500,
    );
  }
});

// PATCH /api/admin/categories/:id
app.patch("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    const category = await categoriesService.updateCategory(id, body);
    return c.json(successResponse(category));
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.startsWith("CONFLICT:")) {
      return c.json(errorResponse("CONFLICT", message.slice(9)), 409);
    }
    if (message.startsWith("NOT_FOUND:")) {
      return c.json(errorResponse("NOT_FOUND", message.slice(10)), 404);
    }
    logError("Update category error", { error: err });
    return c.json(
      errorResponse("INTERNAL_ERROR", "Failed to update category"),
      500,
    );
  }
});

// DELETE /api/admin/categories/:id
app.delete("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    await categoriesService.deleteCategory(id);
    return c.body(null, 204);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.startsWith("NOT_FOUND:")) {
      return c.json(errorResponse("NOT_FOUND", message.slice(10)), 404);
    }
    logError("Delete category error", { error: err });
    return c.json(
      errorResponse("INTERNAL_ERROR", "Failed to delete category"),
      500,
    );
  }
});

export default app;

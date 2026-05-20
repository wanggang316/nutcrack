import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import type { AppVariables } from "../../types.js";
import * as tokensService from "../../services/tokens.js";
import { successResponse, errorResponse } from "../../lib/utils.js";
import { logError } from "../../lib/logger.js";
import { createTokenSchema } from "../../lib/validation.js";

const app = new Hono<{ Variables: AppVariables }>();

// GET /api/admin/tokens
app.get("/", async (c) => {
  try {
    const userId = c.get("userId");
    const items = await tokensService.getTokens(userId);
    return c.json(successResponse({ items }));
  } catch (err) {
    logError("Get tokens error", { error: err });
    return c.json(
      errorResponse("INTERNAL_ERROR", "Failed to fetch tokens"),
      500,
    );
  }
});

// POST /api/admin/tokens
app.post("/", zValidator("json", createTokenSchema), async (c) => {
  const { name } = c.req.valid("json");
  const userId = c.get("userId");
  const result = await tokensService.createToken(name, userId);
  return c.json(successResponse(result), 201);
});

// DELETE /api/admin/tokens/:id
app.delete("/:id", async (c) => {
  const id = c.req.param("id");
  try {
    const userId = c.get("userId");
    await tokensService.deleteToken(id, userId);
    return c.body(null, 204);
  } catch (err) {
    logError("Delete token error", { error: err, tokenId: id });
    return c.json(
      errorResponse("INTERNAL_ERROR", "Failed to delete token"),
      500,
    );
  }
});

// POST /api/admin/tokens/:id/disable
app.post("/:id/disable", async (c) => {
  const id = c.req.param("id");
  try {
    const userId = c.get("userId");
    const token = await tokensService.disableToken(id, userId);
    return c.json(successResponse(token));
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.startsWith("NOT_FOUND:")) {
      return c.json(errorResponse("NOT_FOUND", message.slice(10)), 404);
    }
    logError("Disable token error", { error: err, tokenId: id });
    return c.json(
      errorResponse("INTERNAL_ERROR", "Failed to disable token"),
      500,
    );
  }
});

// POST /api/admin/tokens/:id/enable
app.post("/:id/enable", async (c) => {
  const id = c.req.param("id");
  try {
    const userId = c.get("userId");
    const token = await tokensService.enableToken(id, userId);
    return c.json(successResponse(token));
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.startsWith("NOT_FOUND:")) {
      return c.json(errorResponse("NOT_FOUND", message.slice(10)), 404);
    }
    logError("Enable token error", { error: err, tokenId: id });
    return c.json(
      errorResponse("INTERNAL_ERROR", "Failed to enable token"),
      500,
    );
  }
});

export default app;

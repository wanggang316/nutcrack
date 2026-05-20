import { Hono } from "hono";
import type { AppVariables } from "../../types.js";
import { successResponse } from "../../lib/utils.js";

const app = new Hono<{ Variables: AppVariables }>();

// POST /api/auth/tokens/verify
app.post("/", async (c) => {
  // If we reach here, token auth middleware already validated the token
  return c.json(
    successResponse({
      valid: true,
      token_name: c.get("tokenName"),
      permissions: c.get("tokenPermissions"),
      expires_at: c.get("tokenExpiresAt"),
    }),
  );
});

export default app;

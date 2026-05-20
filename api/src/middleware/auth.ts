import { createMiddleware } from "hono/factory";
import { getDb, schema } from "@nutcrack/db";
import { eq, sql } from "drizzle-orm";
import { getUserBySessionToken } from "../lib/auth-service.js";
import { errorResponse, hashToken } from "../lib/utils.js";
import { logError } from "../lib/logger.js";
import type { AppVariables } from "../types.js";

export const adminAuth = createMiddleware<{ Variables: AppVariables }>(
  async (c, next) => {
    const authorization = c.req.header("Authorization");
    if (!authorization?.startsWith("Bearer ")) {
      return c.json(
        errorResponse(
          "UNAUTHORIZED",
          "Missing or invalid authorization header",
        ),
        401,
      );
    }

    const token = authorization.slice(7);
    const user = await getUserBySessionToken(token);

    if (!user) {
      return c.json(
        errorResponse("UNAUTHORIZED", "Invalid or expired token"),
        401,
      );
    }

    c.set("userId", user.id);
    c.set("userEmail", user.email || "");
    await next();
  },
);

export const tokenAuth = createMiddleware<{ Variables: AppVariables }>(
  async (c, next) => {
    const authorization = c.req.header("Authorization");
    if (!authorization?.startsWith("Bearer ")) {
      return c.json(
        errorResponse(
          "UNAUTHORIZED",
          "Missing or invalid authorization header",
        ),
        401,
      );
    }

    const rawToken = authorization.slice(7);
    const tokenHash = await hashToken(rawToken);

    const db = getDb();
    const tokenRecord = db
      .select()
      .from(schema.apiTokens)
      .where(eq(schema.apiTokens.tokenHash, tokenHash))
      .get();

    if (!tokenRecord) {
      return c.json(errorResponse("UNAUTHORIZED", "Invalid API token"), 401);
    }

    if (tokenRecord.status === "disabled") {
      return c.json(errorResponse("TOKEN_DISABLED", "Token is disabled"), 403);
    }

    if (
      tokenRecord.status === "expired" ||
      (tokenRecord.expiresAt && new Date(tokenRecord.expiresAt) < new Date())
    ) {
      return c.json(errorResponse("TOKEN_EXPIRED", "Token has expired"), 401);
    }

    const ip =
      c.req.header("x-forwarded-for") || c.req.header("x-real-ip") || "unknown";
    try {
      db.update(schema.apiTokens)
        .set({
          usageCount: sql`${schema.apiTokens.usageCount} + 1`,
          lastUsedAt: new Date().toISOString(),
          lastUsedIp: ip,
        })
        .where(eq(schema.apiTokens.id, tokenRecord.id))
        .run();
    } catch (err) {
      logError("Token update error", { error: err, tokenId: tokenRecord.id });
      // Continue even if update fails
    }

    c.set("tokenId", tokenRecord.id);
    // `createdBy` is nullable in the schema; AppVariables.tokenCreatedBy is
    // typed as `string`, so fall back to "" to preserve the legacy contract.
    c.set("tokenCreatedBy", tokenRecord.createdBy ?? "");
    c.set("tokenName", tokenRecord.name);
    c.set("tokenPermissions", tokenRecord.permissions || []);
    c.set("tokenExpiresAt", tokenRecord.expiresAt || null);
    await next();
  },
);

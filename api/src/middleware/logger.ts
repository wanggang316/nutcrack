import { randomUUID } from "node:crypto";

import { getDb, schema } from "@nutcrack/db";
import type { Context, Next } from "hono";

import { logError } from "../lib/logger.js";

export async function operationLogger(c: Context, next: Next) {
  const start = Date.now();
  await next();
  const duration = Date.now() - start;

  // Only log mutating requests
  const method = c.req.method;
  if (method === "GET" || method === "OPTIONS" || method === "HEAD") return;

  const path = c.req.path;
  const action = deriveAction(method, path);
  if (!action) return;

  const ip =
    c.req.header("x-forwarded-for") || c.req.header("x-real-ip") || "unknown";
  const userAgent = c.req.header("user-agent") || null;
  const userId = c.get("userId") || null;
  const tokenId = c.get("tokenId") || null;
  const status = c.res.status >= 400 ? "failed" : "success";

  try {
    getDb()
      .insert(schema.operationLog)
      .values({
        id: randomUUID(),
        action,
        resource: deriveResource(path),
        status,
        ip,
        userAgent,
        userId,
        tokenId,
        duration,
      })
      .run();
  } catch (err) {
    logError("Operation log error", { error: err });
  }
}

function deriveAction(method: string, path: string): string | null {
  if (path.includes("/links") && path.includes("/publish"))
    return "link_publish";
  if (path.includes("/links") && path.includes("/archive"))
    return "link_archive";
  if (path.includes("/links") && path.includes("/reprocess"))
    return "link_reprocess";
  if (path.includes("/links") && path.includes("batch/publish"))
    return "link_batch_publish";
  if (path.includes("/links") && path.includes("batch/delete"))
    return "link_batch_delete";
  if (path.includes("/links") && method === "POST") return "link_add";
  if (path.includes("/links") && method === "PATCH") return "link_update";
  if (path.includes("/links") && method === "DELETE") return "link_delete";
  if (path.includes("/categories") && method === "POST") return "category_add";
  if (path.includes("/categories") && method === "PATCH")
    return "category_update";
  if (path.includes("/categories") && method === "DELETE")
    return "category_delete";
  if (path.includes("/tokens") && path.includes("/disable"))
    return "token_disable";
  if (path.includes("/tokens") && path.includes("/enable"))
    return "token_enable";
  if (path.includes("/tokens") && method === "POST") return "token_create";
  if (path.includes("/tokens") && method === "DELETE") return "token_delete";
  if (path.includes("/settings") && (method === "PUT" || method === "PATCH"))
    return "settings_update";
  if (path.includes("/auth/login")) return "auth_login";
  if (path.includes("/auth/setup-password")) return "auth_setup_password";
  return null;
}

function deriveResource(path: string): string | null {
  if (path.includes("/links")) return "links";
  if (path.includes("/categories")) return "categories";
  if (path.includes("/tokens")) return "tokens";
  if (path.includes("/settings")) return "settings";
  if (path.includes("/auth")) return "auth";
  return null;
}

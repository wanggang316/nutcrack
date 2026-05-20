import { randomUUID } from "node:crypto";

import { and, desc, eq } from "drizzle-orm";

import { getDb, schema } from "@nutcrack/db";
import type { ApiToken } from "@nutcrack/shared";

import { generateApiToken, hashToken } from "../lib/utils.js";

function rowToToken(row: schema.ApiToken): ApiToken {
  return {
    id: row.id,
    prefix: row.prefix,
    name: row.name,
    status: row.status,
    permissions: row.permissions,
    usage_count: row.usageCount,
    last_used_at: row.lastUsedAt,
    last_used_ip: row.lastUsedIp,
    expires_at: row.expiresAt,
    // createdBy is column-nullable (FK), but tokens are always created by an
    // authenticated user and the FK cascades on user delete, so a queried row
    // will always have a non-null createdBy.
    created_by: row.createdBy ?? "",
    created_at: row.createdAt,
  };
}

export async function getTokens(userId: string) {
  const db = getDb();
  const rows = await db
    .select()
    .from(schema.apiTokens)
    .where(eq(schema.apiTokens.createdBy, userId))
    .orderBy(desc(schema.apiTokens.createdAt));
  return rows.map(rowToToken);
}

export async function createToken(name: string, userId: string) {
  const { token, prefix } = generateApiToken();
  const tokenHashValue = await hashToken(token);

  const db = getDb();
  const inserted = await db
    .insert(schema.apiTokens)
    .values({
      id: randomUUID(),
      name,
      prefix,
      tokenHash: tokenHashValue,
      status: "active",
      permissions: ["links:create"],
      createdBy: userId,
    })
    .returning();

  return {
    token: rowToToken(inserted[0]),
    raw_token: token,
  };
}

export async function deleteToken(id: string, userId: string) {
  const db = getDb();
  await db
    .delete(schema.apiTokens)
    .where(
      and(eq(schema.apiTokens.id, id), eq(schema.apiTokens.createdBy, userId)),
    );
}

export async function disableToken(id: string, userId: string) {
  const db = getDb();
  const updated = await db
    .update(schema.apiTokens)
    .set({ status: "disabled" })
    .where(
      and(eq(schema.apiTokens.id, id), eq(schema.apiTokens.createdBy, userId)),
    )
    .returning();
  if (updated.length === 0) {
    throw new Error(`NOT_FOUND:Token '${id}' not found`);
  }
  return rowToToken(updated[0]);
}

export async function enableToken(id: string, userId: string) {
  const db = getDb();
  const updated = await db
    .update(schema.apiTokens)
    .set({ status: "active" })
    .where(
      and(eq(schema.apiTokens.id, id), eq(schema.apiTokens.createdBy, userId)),
    )
    .returning();
  if (updated.length === 0) {
    throw new Error(`NOT_FOUND:Token '${id}' not found`);
  }
  return rowToToken(updated[0]);
}

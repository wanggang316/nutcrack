import { and, desc, eq, sql, type SQL } from "drizzle-orm";

import { getDb, schema } from "@nutcrack/db";

// Drizzle returns rows keyed by the TS property names (camelCase). The public
// API contract (shared types, web client) uses snake_case for these
// `operation_log` rows, so we normalise here.
function rowToActivityLog(row: schema.OperationLog) {
  return {
    id: row.id,
    action: row.action,
    resource: row.resource,
    resource_id: row.resourceId,
    details: row.details,
    status: row.status,
    error_message: row.errorMessage,
    user_agent: row.userAgent,
    ip: row.ip,
    token_id: row.tokenId,
    user_id: row.userId,
    duration: row.duration,
    created_at: row.createdAt,
  };
}

export async function getActivityLogs(query: {
  page?: number;
  page_size?: number;
  action?: string;
  resource?: string;
}) {
  const page = query.page || 1;
  const pageSize = query.page_size || 20;
  const offset = (page - 1) * pageSize;

  const filters: SQL[] = [];
  if (query.action) {
    filters.push(eq(schema.operationLog.action, query.action));
  }
  if (query.resource) {
    filters.push(eq(schema.operationLog.resource, query.resource));
  }
  const where = filters.length === 0 ? undefined : and(...filters);

  const db = getDb();

  const [rows, countRows] = await Promise.all([
    db
      .select()
      .from(schema.operationLog)
      .where(where)
      .orderBy(desc(schema.operationLog.createdAt))
      .limit(pageSize)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(schema.operationLog)
      .where(where),
  ]);

  const total = countRows[0]?.count ?? 0;

  return {
    items: rows.map(rowToActivityLog),
    pagination: {
      page,
      page_size: pageSize,
      total,
      total_pages: Math.ceil(total / pageSize),
    },
  };
}

export async function getRecentActivities(limit = 10) {
  const db = getDb();
  const rows = await db
    .select()
    .from(schema.operationLog)
    .orderBy(desc(schema.operationLog.createdAt))
    .limit(limit);
  return rows.map(rowToActivityLog);
}

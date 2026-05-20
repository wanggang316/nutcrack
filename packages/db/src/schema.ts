import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

const nowSql = sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`;

export type UserMetadata = Record<string, unknown>;
export type OperationLogDetails = Record<string, unknown>;

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export const users = sqliteTable(
  "users",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    role: text("role").$type<"admin" | "user">().notNull().default("user"),
    userMetadata: text("user_metadata", { mode: "json" })
      .$type<UserMetadata>()
      .notNull()
      .default(sql`'{}'`),
    createdAt: text("created_at").notNull().default(nowSql),
    updatedAt: text("updated_at").notNull().default(nowSql),
  },
  (table) => [
    check("users_role_check", sql`${table.role} IN ('admin', 'user')`),
  ],
);

export const sessions = sqliteTable(
  "sessions",
  {
    accessTokenHash: text("access_token_hash").primaryKey(),
    refreshTokenHash: text("refresh_token_hash").notNull().unique(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: text("expires_at").notNull(),
    refreshExpiresAt: text("refresh_expires_at").notNull(),
    createdAt: text("created_at").notNull().default(nowSql),
  },
  (table) => [index("idx_sessions_user_id").on(table.userId)],
);

// ---------------------------------------------------------------------------
// Core domain — links
// ---------------------------------------------------------------------------

export const categories = sqliteTable("categories", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  icon: text("icon"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: text("created_at").notNull().default(nowSql),
  updatedAt: text("updated_at").notNull().default(nowSql),
});

export const links = sqliteTable(
  "links",
  {
    id: text("id").primaryKey(),
    url: text("url").notNull(),
    originalTitle: text("original_title"),
    originalContent: text("original_content"),
    originalDescription: text("original_description"),
    title: text("title"),
    summary: text("summary"),
    keyPoints: text("key_points", { mode: "json" })
      .$type<string[]>()
      .notNull()
      .default(sql`'[]'`),
    categoryId: text("category_id").references(() => categories.id, {
      onDelete: "set null",
    }),
    aiTitle: text("ai_title"),
    aiSummary: text("ai_summary"),
    aiKeyPoints: text("ai_key_points", { mode: "json" })
      .$type<string[]>()
      .notNull()
      .default(sql`'[]'`),
    aiCategory: text("ai_category"),
    status: text("status")
      .$type<"pending" | "published" | "archived" | "deleted">()
      .notNull()
      .default("pending"),
    processingStatus: text("processing_status")
      .$type<"queued" | "fetching" | "analyzing" | "completed" | "failed">()
      .notNull()
      .default("queued"),
    publishedAt: text("published_at"),
    createdAt: text("created_at").notNull().default(nowSql),
    updatedAt: text("updated_at").notNull().default(nowSql),
    createdBy: text("created_by").references(() => users.id, {
      onDelete: "cascade",
    }),
    processError: text("process_error"),
  },
  (table) => [
    check(
      "links_status_check",
      sql`${table.status} IN ('pending', 'published', 'archived', 'deleted')`,
    ),
    check(
      "links_processing_status_check",
      sql`${table.processingStatus} IN ('queued', 'fetching', 'analyzing', 'completed', 'failed')`,
    ),
    index("idx_links_status").on(table.status),
    index("idx_links_processing_status").on(table.processingStatus),
    index("idx_links_created_at").on(table.createdAt),
    index("idx_links_published_at").on(table.publishedAt),
    index("idx_links_category_id").on(table.categoryId),
    index("idx_links_created_by").on(table.createdBy),
  ],
);

export const linkTags = sqliteTable(
  "link_tags",
  {
    linkId: text("link_id")
      .notNull()
      .references(() => links.id, { onDelete: "cascade" }),
    tag: text("tag").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.linkId, table.tag] }),
    index("idx_link_tags_tag").on(table.tag),
  ],
);

export const linkAiTags = sqliteTable(
  "link_ai_tags",
  {
    linkId: text("link_id")
      .notNull()
      .references(() => links.id, { onDelete: "cascade" }),
    tag: text("tag").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.linkId, table.tag] }),
    index("idx_link_ai_tags_tag").on(table.tag),
  ],
);

export const apiTokens = sqliteTable(
  "api_tokens",
  {
    id: text("id").primaryKey(),
    prefix: text("prefix").notNull(),
    name: text("name").notNull(),
    tokenHash: text("token_hash").notNull().unique(),
    status: text("status")
      .$type<"active" | "disabled" | "expired">()
      .notNull()
      .default("active"),
    permissions: text("permissions", { mode: "json" })
      .$type<string[]>()
      .notNull()
      .default(sql`'[]'`),
    usageCount: integer("usage_count").notNull().default(0),
    lastUsedAt: text("last_used_at"),
    lastUsedIp: text("last_used_ip"),
    expiresAt: text("expires_at"),
    createdBy: text("created_by").references(() => users.id, {
      onDelete: "cascade",
    }),
    createdAt: text("created_at").notNull().default(nowSql),
  },
  (table) => [
    check(
      "api_tokens_status_check",
      sql`${table.status} IN ('active', 'disabled', 'expired')`,
    ),
    index("idx_api_tokens_created_by").on(table.createdBy),
    index("idx_api_tokens_status").on(table.status),
  ],
);

export const settings = sqliteTable(
  "settings",
  {
    key: text("key").primaryKey(),
    value: text("value").notNull(),
    type: text("type")
      .$type<"string" | "number" | "boolean" | "json">()
      .notNull()
      .default("string"),
    description: text("description"),
    updatedAt: text("updated_at").notNull().default(nowSql),
    updatedBy: text("updated_by").references(() => users.id, {
      onDelete: "set null",
    }),
  },
  (table) => [
    check(
      "settings_type_check",
      sql`${table.type} IN ('string', 'number', 'boolean', 'json')`,
    ),
  ],
);

export const operationLog = sqliteTable(
  "operation_log",
  {
    id: text("id").primaryKey(),
    action: text("action").notNull(),
    resource: text("resource"),
    resourceId: text("resource_id"),
    details: text("details", { mode: "json" }).$type<OperationLogDetails>(),
    status: text("status")
      .$type<"success" | "failed" | "pending">()
      .notNull()
      .default("success"),
    errorMessage: text("error_message"),
    userAgent: text("user_agent"),
    ip: text("ip"),
    tokenId: text("token_id").references(() => apiTokens.id, {
      onDelete: "set null",
    }),
    userId: text("user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    duration: integer("duration"),
    createdAt: text("created_at").notNull().default(nowSql),
  },
  (table) => [
    check(
      "operation_log_status_check",
      sql`${table.status} IN ('success', 'failed', 'pending')`,
    ),
    index("idx_operation_log_created_at").on(sql`${table.createdAt} DESC`),
    index("idx_operation_log_user_id").on(table.userId),
    index("idx_operation_log_token_id").on(table.tokenId),
    index("idx_operation_log_action").on(table.action),
  ],
);

// ---------------------------------------------------------------------------
// Inferred select / insert types
// ---------------------------------------------------------------------------

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
export type Link = typeof links.$inferSelect;
export type NewLink = typeof links.$inferInsert;
export type LinkTag = typeof linkTags.$inferSelect;
export type LinkAiTag = typeof linkAiTags.$inferSelect;
export type ApiToken = typeof apiTokens.$inferSelect;
export type NewApiToken = typeof apiTokens.$inferInsert;
export type Setting = typeof settings.$inferSelect;
export type NewSetting = typeof settings.$inferInsert;
export type OperationLog = typeof operationLog.$inferSelect;
export type NewOperationLog = typeof operationLog.$inferInsert;

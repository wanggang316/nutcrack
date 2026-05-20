import { getDb } from "./client.js";
import * as schema from "./schema.js";

/**
 * For tests: set `process.env.DATABASE_URL = ':memory:'` BEFORE importing
 * `@nutcrack/db`, then call `resetTestDb()` in `beforeEach` to clear all
 * tables. Deletes in FK-safe order: children first, parents last.
 */
export function resetTestDb(): void {
  const db = getDb();
  db.delete(schema.linkAiTags).run();
  db.delete(schema.linkTags).run();
  db.delete(schema.operationLog).run();
  db.delete(schema.links).run();
  db.delete(schema.apiTokens).run();
  db.delete(schema.settings).run();
  db.delete(schema.categories).run();
  db.delete(schema.sessions).run();
  db.delete(schema.users).run();
}

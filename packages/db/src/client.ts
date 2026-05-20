import { existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import Database, { type Database as BetterSqlite3Database } from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";

import * as schema from "./schema.js";

// Resolve repo root. After tsup bundles, this file ends up at
// packages/db/dist/index.js; during dev (tsx) it's packages/db/src/client.ts.
// Both are three directories deep from the repo root.
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, "..", "..", "..");

export function getDatabasePath(): string {
  const fromEnv = process.env.DATABASE_URL;
  const dbPath = fromEnv && fromEnv.length > 0 ? fromEnv : resolve(REPO_ROOT, "data", "nutcrack.db");
  const parent = dirname(dbPath);
  if (!existsSync(parent)) {
    mkdirSync(parent, { recursive: true });
  }
  return dbPath;
}

export type DbClient = BetterSQLite3Database<typeof schema>;

let _sqlite: BetterSqlite3Database | null = null;
let _db: DbClient | null = null;

function openSqlite(): BetterSqlite3Database {
  const dbPath = getDatabasePath();
  try {
    const inst = new Database(dbPath);
    inst.pragma("journal_mode = WAL");
    inst.pragma("busy_timeout = 5000");
    inst.pragma("foreign_keys = ON");
    return inst;
  } catch (err) {
    throw new Error(
      `Failed to open SQLite database at ${dbPath}: ${(err as Error).message}`,
      { cause: err },
    );
  }
}

export function getSqlite(): BetterSqlite3Database {
  if (!_sqlite) {
    _sqlite = openSqlite();
  }
  return _sqlite;
}

export function getDb(): DbClient {
  if (!_db) {
    _db = drizzle(getSqlite(), { schema });
  }
  return _db;
}

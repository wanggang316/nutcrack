import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { migrate } from "drizzle-orm/better-sqlite3/migrator";

import { getDb, getSqlite } from "./client.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PACKAGE_DIR = resolve(__dirname, "..");
const MIGRATIONS_FOLDER = resolve(PACKAGE_DIR, "migrations");

export function runMigrations(): void {
  const sqlite = getSqlite();
  sqlite.pragma("foreign_keys = OFF");
  try {
    migrate(getDb(), { migrationsFolder: MIGRATIONS_FOLDER });
  } finally {
    sqlite.pragma("foreign_keys = ON");
  }
}

const isMain = (() => {
  if (!process.argv[1]) return false;
  try {
    return resolve(process.argv[1]) === fileURLToPath(import.meta.url);
  } catch {
    return false;
  }
})();

if (isMain) {
  runMigrations();
}

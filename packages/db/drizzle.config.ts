import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig } from "drizzle-kit";

// Inline path resolution to avoid importing from ./src/client — drizzle-kit only
// needs a schema diff and must not open the SQLite database as a side effect of
// loading this config.
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, "..", "..");

export default defineConfig({
  dialect: "sqlite",
  schema: "./src/schema.ts",
  out: "./migrations",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? resolve(REPO_ROOT, "data", "nutcrack.db"),
  },
});

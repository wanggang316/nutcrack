# Nutcrack

Personal information collection — save links, auto-summarize, browse later.

Monorepo:

- `packages/db` — SQLite schema + Drizzle ORM
- `packages/shared` — API client + shared types
- `packages/ai` — LLM analysis (title / summary / tags / category)
- `packages/scrape` — Article fetch + readability extraction
- `api` — Hono HTTP API
- `web` — React admin + public pages
- `extension` — Browser extension (save current page)
- `cli` — `nutcrack` CLI

## Quick start

```bash
pnpm install
pnpm build
pnpm dev
```

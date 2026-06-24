---
name: nutcrack-cli
description: >-
  Use when driving the Nutcrack service from the terminal with the `nutcrack`
  CLI — configuring the base URL / API token, verifying a token, and
  adding / batch-adding / getting / listing links. Covers local config storage,
  authentication, every command and flag, batch-file formats, text vs JSON
  output, and exit codes. Source of truth is `cli/src/`, not `cli/README.md`
  (that README is stale — it predates the rename and lists commands the CLI
  does not implement).
---

# Nutcrack CLI

`nutcrack` is a thin, resource-oriented CLI over the Nutcrack auth API
(`/api/auth/*`). It does three things: store local config, verify your API
token, and manage links (add / batch-add / get / list). Everything is backed by
HTTP calls — the CLI holds no state beyond a single local config file.

> Authoritative reference: the command tree is defined in
> `cli/src/index.ts` and `cli/src/commands/*.ts`; the HTTP endpoints live in
> `packages/shared/src/auth-api-client.ts`. If this skill and `cli/README.md`
> disagree, the source (and this skill) win.

## Invoking the CLI

The published binary is `nutcrack` (package `nutcrack-cli`, `bin.nutcrack`).
Pick whichever fits the context:

```bash
# Installed (global link / published package)
nutcrack <command> [flags]

# From the monorepo, no build needed (runs src via tsx)
cd cli && pnpm dev -- <command> [flags]

# After a build (tsup -> cli/dist/index.js)
cd cli && pnpm build
node cli/dist/index.js <command> [flags]
```

`pnpm dev` maps to `tsx src/index.ts`, so it always reflects the current
source. Use the `--` separator so flags reach the CLI rather than pnpm.

Get help at any level:

```bash
nutcrack --help
nutcrack config --help
nutcrack link list --help
```

## First-run setup

Two values are required before any networked command works: a base URL and an
API token. Set them once; they persist in the config file.

```bash
nutcrack config set base-url http://localhost:3000
nutcrack config set api-token <your_token>
nutcrack config set output json      # optional: default text, or json
nutcrack token verify                # confirm the token is accepted
```

If `base_url` is missing you get:
`Missing base_url. Run \`nutcrack config set base-url <url>\`.`
If `api_token` is missing (on any command except config):
`Missing api_token. Run \`nutcrack config set api-token <token>\`.`

## Configuration

Config is stored as JSON at `~/.config/nutcrack/config.json`
(`$HOME/.config/nutcrack/config.json`). There is no env-var or per-command
override path in the current CLI — config commands are the only way to set it.

| Key         | Stored as   | Meaning                                              |
|-------------|-------------|------------------------------------------------------|
| `base-url`  | `base_url`  | Nutcrack service origin, e.g. `http://localhost:3000`|
| `api-token` | `api_token` | Bearer token sent on every `/api/auth/*` request     |
| `output`    | `output`    | Default render format: `text` (default) or `json`    |

```bash
nutcrack config set <key> <value>   # set one key (base-url | api-token | output)
nutcrack config get                 # human-readable view (token shown by formatter)
nutcrack config get-json            # raw JSON of the config file
nutcrack config reset               # delete the config file
```

Notes:
- `output` only accepts `text` or `json`; any other value normalizes to `text`.
- `config get` / `get-json` read the file directly and error with
  `Config not found.` when it does not exist yet.
- `config reset` is idempotent — removing a non-existent file is not an error.

## Commands

### `token verify`

Checks the configured token against `POST /api/auth/tokens/verify`.

```bash
nutcrack token verify
```

Text output reports `valid`, `token_name`, `permissions`, `expires_at`.
With `output=json` you get the raw `VerifyTokenResponse`.

### `link add`

Submit a single URL. Backed by `POST /api/auth/links`.

```bash
nutcrack link add --url https://example.com/post
```

`--url` is required. Returns the created link's `id`, `url`, `status`,
`processing_status`, `created_at`. Keep the `id` — it's what `link get` needs.

### `link batch-add`

Submit many URLs at once via `POST /api/auth/links/batch`. Sources can be
combined: repeated `--url` flags and/or a `--file`.

```bash
nutcrack link batch-add --url https://a.com --url https://b.com
nutcrack link batch-add --file ./links.json
nutcrack link batch-add --url https://a.com --file ./links.json   # both merged
```

At least one URL must result (from flags or file) or it errors with
`Provide at least one --url or --file.`. The result lists each URL as
`<url> -> <status> (<id>)` or `<url> -> failed (<error>)`.

**Batch file format** (`--file`) accepts either shape:

```json
["https://example.com/a", "https://example.com/b"]
```

```json
{ "urls": ["https://example.com/a", "https://example.com/b"] }
```

Anything else throws
`Batch file must be a JSON array of urls or an object with urls.`.

### `link get`

Fetch one link by id via `GET /api/auth/links/:id`.

```bash
nutcrack link get --id 6d805c4d-7f3f-4c93-bc7d-68f0937dbe0f
```

`--id` is required. Text output prints every returned field as `key: value`;
JSON output returns the full object.

### `link list`

List links created by the current token via `GET /api/auth/links`. All flags
are optional filters / paging controls and are forwarded as query params.

```bash
nutcrack link list
nutcrack link list --page 2 --page-size 10
nutcrack link list --status pending --processing-status analyzing
nutcrack link list --q agent --tags AI,Tools --sort-by created_at --sort-order desc
```

| Flag                  | Query param         | Notes                              |
|-----------------------|---------------------|------------------------------------|
| `--page`              | `page`              | default 1                          |
| `--page-size`         | `page_size`         | default 20                         |
| `--q`                 | `q`                 | search url / title / summary       |
| `--category`          | `category`          | filter by category name            |
| `--tags`              | `tags`              | comma-separated                    |
| `--status`            | `status`            | business status                    |
| `--processing-status` | `processing_status` | processing pipeline status         |
| `--sort-by`           | `sort_by`           | default `created_at`               |
| `--sort-order`        | `sort_order`        | `asc` or `desc`, default `desc`    |

Text output prints a `page/total_pages`, `page_size`, `total` header followed by
one line per item: `<id> <status>/<processing_status> <url> - <title>`.

## Output modes

Every networked command honors the resolved `output` setting:

- `text` (default) — compact, human-readable lines.
- `json` — the raw API response, suitable for piping into `jq`.

Set it persistently with `nutcrack config set output json`. There is currently
no per-invocation `--output` flag; change the config to switch formats.

```bash
nutcrack config set output json
nutcrack link list --status pending | jq '.items[].url'
```

## Exit codes

The CLI maps API failures to distinct exit codes (see
`cli/src/utils/errors.ts`) — useful in scripts:

| Exit | Condition                                                        |
|------|-----------------------------------------------------------------|
| `0`  | success                                                          |
| `3`  | auth problem: `UNAUTHORIZED`, `TOKEN_EXPIRED`, `TOKEN_DISABLED`  |
| `4`  | `VALIDATION_ERROR` (bad request payload)                        |
| `1`  | any other API error, or a local error (bad config/file, etc.)   |

Error messages go to stderr; successful output goes to stdout.

```bash
nutcrack token verify || case $? in
  3) echo "token rejected — reset it: nutcrack config set api-token <new>";;
  *) echo "verify failed";;
esac
```

## Common workflows

**Bootstrap against a local API and smoke-test:**

```bash
nutcrack config set base-url http://localhost:3000
nutcrack config set api-token "$NUTCRACK_TOKEN"
nutcrack token verify
nutcrack link add --url https://example.com
```

**Bulk import from a saved list, then watch processing:**

```bash
nutcrack link batch-add --file ./links.json
nutcrack config set output json
nutcrack link list --processing-status analyzing | jq '.pagination.total'
```

**Switch environments:** re-point the base URL (token usually differs too):

```bash
nutcrack config set base-url https://nutcrack.example.com
nutcrack config set api-token "$PROD_TOKEN"
nutcrack token verify
```

## Troubleshooting

- `Missing base_url` / `Missing api_token` → run the matching `config set`.
- `Config not found.` on `config get` → nothing saved yet; set a value first.
- Exit `3` on any command → token invalid/expired/disabled; mint a new one and
  `config set api-token`.
- Exit `4` → the request payload was rejected (e.g. malformed URL); check the
  stderr message for the field.
- Batch file rejected → it must be a JSON array of URL strings or `{ "urls": [...] }`.
- Stale `cli/README.md` mentions `social-post` commands — those are **not**
  implemented; only `config`, `token`, and `link` exist.

import { Command } from "commander";
import { getAuthClient } from "../adapters/auth-client.js";
import { loadUrlsFromFile } from "../utils/files.js";
import { outputResult } from "../utils/output.js";

export function createLinkCommand() {
  const command = new Command("link")
    .description("Manage links through /api/auth/links")
    .addHelpText(
      "after",
      `
Examples:
  nutcrack link add --url https://example.com
  nutcrack link batch-add --url https://a.com --url https://b.com
  nutcrack link batch-add --file ./links.json
  nutcrack link get --id 6d805c4d-7f3f-4c93-bc7d-68f0937dbe0f
  nutcrack link list --status pending --processing-status analyzing
`,
    );

  command
    .command("add")
    .description("Add one link")
    .requiredOption("--url <url>", "link url to submit")
    .addHelpText(
      "after",
      `
Example:
  nutcrack link add --url https://example.com/post
`,
    )
    .action(async (options: { url: string }) => {
      const { client, config } = await getAuthClient();
      const result = await client.createLink({ url: options.url });
      outputResult(config.output, result, (value) => {
        const data = value as {
          id: string;
          url: string;
          status: string;
          processing_status: string;
          created_at?: string;
        };
        return [
          `id: ${data.id}`,
          `url: ${data.url}`,
          `status: ${data.status}`,
          `processing_status: ${data.processing_status}`,
          `created_at: ${data.created_at ?? ""}`,
        ];
      });
    });

  command
    .command("batch-add")
    .description("Add multiple links")
    .option(
      "--url <url>",
      "repeatable url, can be used multiple times",
      collectUrls,
      [],
    )
    .option(
      "--file <path>",
      'JSON file containing either ["url1", "url2"] or {"urls": ["url1", "url2"]}',
    )
    .addHelpText(
      "after",
      `
Examples:
  nutcrack link batch-add --url https://a.com --url https://b.com
  nutcrack link batch-add --file ./links.json
`,
    )
    .action(async (options: { url: string[]; file?: string }) => {
      const urls = [...options.url];
      if (options.file) {
        urls.push(...(await loadUrlsFromFile(options.file)));
      }
      if (urls.length === 0) {
        throw new Error("Provide at least one --url or --file.");
      }

      const { client, config } = await getAuthClient();
      const result = await client.createLinksBatch({ urls });
      outputResult(config.output, result, (value) => {
        const data = value as {
          items: Array<{
            url: string;
            id?: string | null;
            status?: string;
            error?: { message?: string } | string;
          }>;
        };
        return data.items.map((item) => {
          const error =
            typeof item.error === "string" ? item.error : item.error?.message;
          return error
            ? `${item.url} -> failed (${error})`
            : `${item.url} -> ${item.status ?? "created"} (${item.id ?? ""})`;
        });
      });
    });

  command
    .command("get")
    .description("Get one link by id")
    .requiredOption("--id <id>", "link id returned by add or batch-add")
    .addHelpText(
      "after",
      `
Example:
  nutcrack link get --id 6d805c4d-7f3f-4c93-bc7d-68f0937dbe0f
`,
    )
    .action(async (options: { id: string }) => {
      const { client, config } = await getAuthClient();
      const result = await client.getLink(options.id);
      outputResult(config.output, result, (value) => {
        const data = value as Record<string, unknown>;
        return Object.entries(data).map(
          ([key, item]) => `${key}: ${formatScalar(item)}`,
        );
      });
    });

  command
    .command("list")
    .description("List links created by the current token")
    .option("--page <page>", "page number, default 1")
    .option("--page-size <pageSize>", "page size, default 20")
    .option("--q <query>", "search in url, title, summary")
    .option("--category <category>", "filter by category name")
    .option("--tags <tags>", "filter by comma-separated tags")
    .option("--status <status>", "filter by business status")
    .option(
      "--processing-status <processingStatus>",
      "filter by processing status",
    )
    .option("--sort-by <sortBy>", "sort field, default created_at")
    .option("--sort-order <sortOrder>", "asc or desc, default desc")
    .addHelpText(
      "after",
      `
Examples:
  nutcrack link list
  nutcrack link list --page 2 --page-size 10
  nutcrack link list --status pending --processing-status analyzing
  nutcrack link list --q agent --tags AI,Tools
`,
    )
    .action(async (options) => {
      const { client, config } = await getAuthClient();
      const result = await client.getLinks({
        page: toNumber(options.page),
        page_size: toNumber(options.pageSize),
        q: options.q,
        category: options.category,
        tags: options.tags,
        status: options.status,
        processing_status: options.processingStatus,
        sort_by: options.sortBy,
        sort_order: options.sortOrder,
      });
      outputResult(config.output, result, (value) => {
        const data = value as {
          items: Array<{
            id: string;
            url: string;
            status: string;
            processing_status: string;
            title: string | null;
          }>;
          pagination: {
            page: number;
            page_size: number;
            total: number;
            total_pages: number;
          };
        };
        return [
          `page: ${data.pagination.page}/${data.pagination.total_pages}`,
          `page_size: ${data.pagination.page_size}`,
          `total: ${data.pagination.total}`,
          ...data.items.map(
            (item) =>
              `${item.id} ${item.status}/${item.processing_status} ${item.url}${item.title ? ` - ${item.title}` : ""}`,
          ),
        ];
      });
    });

  return command;
}

function collectUrls(value: string, previous: string[]) {
  previous.push(value);
  return previous;
}

function toNumber(value?: string) {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
}

function formatScalar(value: unknown) {
  if (Array.isArray(value) || (value && typeof value === "object")) {
    return JSON.stringify(value);
  }
  return String(value ?? "");
}

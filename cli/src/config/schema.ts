import type {
  CliConfig,
  CliOutputFormat,
  CliPartialConfig,
} from "../types/cli.js";

const OUTPUT_VALUES = new Set<CliOutputFormat>(["text", "json"]);

export function parsePartialConfig(value: unknown): CliPartialConfig {
  if (!value || typeof value !== "object") {
    throw new Error("Invalid config file");
  }

  const candidate = value as Partial<CliConfig>;
  const parsed: CliPartialConfig = {};

  if (candidate.base_url !== undefined) {
    if (
      typeof candidate.base_url !== "string" ||
      candidate.base_url.length === 0
    ) {
      throw new Error("Config base_url must be a non-empty string");
    }
    parsed.base_url = candidate.base_url;
  }

  if (candidate.api_token !== undefined) {
    if (
      typeof candidate.api_token !== "string" ||
      candidate.api_token.length === 0
    ) {
      throw new Error("Config api_token must be a non-empty string");
    }
    parsed.api_token = candidate.api_token;
  }

  if (candidate.output !== undefined) {
    if (!OUTPUT_VALUES.has(candidate.output)) {
      throw new Error("Config output must be text or json");
    }
    parsed.output = candidate.output;
  }

  return parsed;
}

export function validateConfig(value: unknown): CliConfig {
  const candidate = parsePartialConfig(value);
  if (!candidate.base_url) {
    throw new Error("Config missing base_url");
  }
  if (!candidate.api_token) {
    throw new Error("Config missing api_token");
  }

  return {
    base_url: candidate.base_url,
    api_token: candidate.api_token,
    output: candidate.output ?? "text",
  };
}

export function normalizeOutput(value: string | undefined): CliOutputFormat {
  return value === "json" ? "json" : "text";
}

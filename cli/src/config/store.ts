import fs from "node:fs/promises";
import path from "node:path";
import { getConfigDir, getConfigPath } from "./paths.js";
import {
  normalizeOutput,
  parsePartialConfig,
  validateConfig,
} from "./schema.js";
import type {
  CliConfig,
  CliOverrides,
  CliPartialConfig,
  CliResolvedConfig,
} from "../types/cli.js";

async function readIfExists(filePath: string) {
  try {
    return await fs.readFile(filePath, "utf8");
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === "ENOENT") {
      return null;
    }
    throw error;
  }
}

export async function loadConfigFile(): Promise<
  (CliPartialConfig & { config_path: string }) | null
> {
  const configPath = getConfigPath();
  const raw = await readIfExists(configPath);
  if (!raw) {
    return null;
  }

  const parsed = JSON.parse(raw) as unknown;
  return {
    ...parsePartialConfig(parsed),
    config_path: configPath,
  };
}

export async function saveConfig(
  patch: Partial<CliConfig>,
): Promise<CliPartialConfig & { config_path: string }> {
  const current = await loadConfigFile();
  const next: CliPartialConfig = {
    base_url: patch.base_url ?? current?.base_url,
    api_token: patch.api_token ?? current?.api_token,
    output: patch.output ?? current?.output ?? "text",
  };

  const parsed = parsePartialConfig(next);
  const configPath = getConfigPath();

  await fs.mkdir(path.dirname(configPath), { recursive: true });
  await fs.writeFile(
    configPath,
    `${JSON.stringify(parsed, null, 2)}\n`,
    "utf8",
  );

  return {
    ...parsed,
    config_path: configPath,
  };
}

export async function resetConfig() {
  const configPath = getConfigPath();
  try {
    await fs.unlink(configPath);
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code !== "ENOENT") {
      throw error;
    }
  }
}

export async function resolveConfig(
  overrides: CliOverrides = {},
  options: { require_auth?: boolean } = {},
): Promise<CliResolvedConfig> {
  const fromFile = await loadConfigFile();
  const resolved: CliResolvedConfig = {
    base_url: overrides.base_url ?? fromFile?.base_url ?? "",
    api_token: overrides.api_token ?? fromFile?.api_token ?? "",
    output: normalizeOutput(overrides.output ?? fromFile?.output),
    config_path: fromFile?.config_path ?? getConfigPath(),
  };

  if (!resolved.base_url) {
    throw new Error(
      "Missing base_url. Run `nutcrack config set base-url <url>`.",
    );
  }

  if (options.require_auth !== false && !resolved.api_token) {
    throw new Error(
      "Missing api_token. Run `nutcrack config set api-token <token>`.",
    );
  }

  return resolved;
}

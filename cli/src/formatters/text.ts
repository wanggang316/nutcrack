import type { CliPartialConfig, CliResolvedConfig } from "../types/cli.js";

export function printConfig(
  config: (CliPartialConfig & { config_path: string }) | CliResolvedConfig,
) {
  process.stdout.write(
    [
      `config_path: ${config.config_path}`,
      `base_url: ${config.base_url ?? ""}`,
      `api_token: ${config.api_token ? maskToken(config.api_token) : ""}`,
      `output: ${config.output ?? "text"}`,
    ].join("\n") + "\n",
  );
}

export function printLines(lines: Array<string | number | null | undefined>) {
  process.stdout.write(
    `${lines.filter((line) => line !== null && line !== undefined).join("\n")}\n`,
  );
}

function maskToken(token: string) {
  if (token.length <= 8) return token;
  return `${token.slice(0, 4)}...${token.slice(-4)}`;
}

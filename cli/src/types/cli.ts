export type CliOutputFormat = "text" | "json";

export interface CliConfig {
  base_url: string;
  api_token: string;
  output: CliOutputFormat;
}

export interface CliPartialConfig {
  base_url?: string;
  api_token?: string;
  output?: CliOutputFormat;
}

export interface CliResolvedConfig extends CliConfig {
  config_path: string;
}

export interface CliOverrides {
  base_url?: string;
  api_token?: string;
  output?: CliOutputFormat;
}

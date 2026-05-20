import { createAuthApiClient } from "@nutcrack/shared";
import { resolveConfig } from "../config/store.js";
import type { CliOverrides } from "../types/cli.js";

export async function getAuthClient(overrides: CliOverrides = {}) {
  const config = await resolveConfig(overrides);
  const client = createAuthApiClient({
    base_url: config.base_url,
    get_access_token: () => config.api_token,
  });

  return { client, config };
}

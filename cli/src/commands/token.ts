import { Command } from "commander";
import { getAuthClient } from "../adapters/auth-client.js";
import { outputResult } from "../utils/output.js";

export function createTokenCommand() {
  const command = new Command("token")
    .description("Token-related commands")
    .addHelpText(
      "after",
      `
Examples:
  nutcrack token verify
`,
    );

  command
    .command("verify")
    .description("Verify whether the configured API token is valid")
    .action(async () => {
      const { client, config } = await getAuthClient();
      const result = await client.verifyToken();
      outputResult(config.output, result, (value) => {
        const data = value as {
          valid: boolean;
          token_name?: string;
          permissions?: string[];
          expires_at?: string | null;
        };
        return [
          `valid: ${data.valid}`,
          `token_name: ${data.token_name ?? ""}`,
          `permissions: ${(data.permissions ?? []).join(",")}`,
          `expires_at: ${data.expires_at ?? ""}`,
        ];
      });
    });

  return command;
}

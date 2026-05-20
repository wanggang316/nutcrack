import { Command } from "commander";
import { loadConfigFile, resetConfig, saveConfig } from "../config/store.js";
import { normalizeOutput } from "../config/schema.js";
import { printJson } from "../formatters/json.js";
import { printConfig } from "../formatters/text.js";

export function createConfigCommand() {
  const command = new Command("config")
    .description("Manage local CLI configuration")
    .addHelpText(
      "after",
      `
Config keys:
  base-url   Nutcrack service base url, for example http://localhost:3000
  api-token  API token used for /api/auth/* requests
  output     Default output format: text or json

Examples:
  nutcrack config set base-url http://localhost:3000
  nutcrack config set api-token your_token
  nutcrack config set output json
  nutcrack config get
  nutcrack config reset
`,
    );

  command
    .command("set")
    .description("Set one config value")
    .argument("<key>", "base-url | api-token | output")
    .argument("<value>", "value to store")
    .action(async (key: string, value: string) => {
      if (key === "base-url") {
        printConfig(await saveConfig({ base_url: value }));
        return;
      }
      if (key === "api-token") {
        printConfig(await saveConfig({ api_token: value }));
        return;
      }
      if (key === "output") {
        printConfig(await saveConfig({ output: normalizeOutput(value) }));
        return;
      }
      throw new Error("Supported config keys: base-url, api-token, output");
    });

  command
    .command("get")
    .description("Show current config")
    .action(async () => {
      const config = await loadConfigFile();
      if (!config) {
        throw new Error("Config not found.");
      }
      printConfig(config);
    });

  command
    .command("get-json")
    .description("Show current config as JSON")
    .action(async () => {
      const config = await loadConfigFile();
      if (!config) {
        throw new Error("Config not found.");
      }
      printJson(config);
    });

  command
    .command("reset")
    .description("Remove local config file")
    .action(async () => {
      await resetConfig();
      process.stdout.write("Config removed.\n");
    });

  return command;
}

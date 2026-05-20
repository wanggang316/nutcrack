#!/usr/bin/env node

import { Command } from "commander";
import { createConfigCommand } from "./commands/config.js";
import { createLinkCommand } from "./commands/link.js";
import { createTokenCommand } from "./commands/token.js";
import { handleCliError } from "./utils/errors.js";

const program = new Command();

program
  .name("nutcrack")
  .description("Nutcrack CLI for auth APIs")
  .addHelpText(
    "after",
    `
Examples:
  nutcrack config set base-url http://localhost:3000
  nutcrack config set api-token your_token
  nutcrack token verify
  nutcrack link add --url https://example.com
  nutcrack link list --page 1 --page-size 20
`,
  )
  .showHelpAfterError();

program.addCommand(createConfigCommand());
program.addCommand(createTokenCommand());
program.addCommand(createLinkCommand());

program.parseAsync(process.argv).catch((error) => {
  handleCliError(error);
});

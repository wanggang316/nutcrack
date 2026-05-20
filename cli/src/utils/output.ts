import type { CliOutputFormat } from "../types/cli.js";
import { printJson } from "../formatters/json.js";
import { printLines } from "../formatters/text.js";

export function outputResult(
  format: CliOutputFormat,
  value: unknown,
  renderText?: (value: unknown) => string[],
) {
  if (format === "json") {
    printJson(value);
    return;
  }

  if (renderText) {
    printLines(renderText(value));
    return;
  }

  printLines([String(value)]);
}

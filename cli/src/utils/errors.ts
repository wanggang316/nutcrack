import { ApiClientError } from "@nutcrack/shared";

export function handleCliError(error: unknown) {
  if (error instanceof ApiClientError) {
    process.stderr.write(`${error.message}\n`);
    if (
      error.code === "UNAUTHORIZED" ||
      error.code === "TOKEN_EXPIRED" ||
      error.code === "TOKEN_DISABLED"
    ) {
      process.exitCode = 3;
      return;
    }
    if (error.code === "VALIDATION_ERROR") {
      process.exitCode = 4;
      return;
    }
    process.exitCode = 1;
    return;
  }

  const message = error instanceof Error ? error.message : "Unknown error";
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
}

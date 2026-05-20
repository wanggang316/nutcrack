import fs from "node:fs/promises";

export async function loadUrlsFromFile(filePath: string): Promise<string[]> {
  const raw = await fs.readFile(filePath, "utf8");
  const parsed = JSON.parse(raw) as unknown;

  if (
    Array.isArray(parsed) &&
    parsed.every((item) => typeof item === "string")
  ) {
    return parsed;
  }

  if (
    parsed &&
    typeof parsed === "object" &&
    Array.isArray((parsed as { urls?: unknown }).urls) &&
    (parsed as { urls: unknown[] }).urls.every(
      (item) => typeof item === "string",
    )
  ) {
    return (parsed as { urls: string[] }).urls;
  }

  throw new Error(
    "Batch file must be a JSON array of urls or an object with urls.",
  );
}

export async function loadItemsFromFile<T>(
  filePath: string,
  key = "items",
): Promise<T[]> {
  const raw = await fs.readFile(filePath, "utf8");
  const parsed = JSON.parse(raw) as unknown;

  if (Array.isArray(parsed)) {
    return parsed as T[];
  }

  if (
    parsed &&
    typeof parsed === "object" &&
    Array.isArray((parsed as Record<string, unknown>)[key])
  ) {
    return (parsed as Record<string, unknown>)[key] as T[];
  }

  throw new Error(`Batch file must be a JSON array or an object with ${key}.`);
}

import OpenAI from "openai";

export interface AiRuntimeConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
  temperature?: number;
  timeoutMs?: number;
  maxRetries?: number;
}

export interface GenerateJsonRequest<T> {
  prompt: string;
  systemPrompt?: string;
  parse: (value: unknown) => T;
}

function createClient(config: AiRuntimeConfig) {
  return new OpenAI({
    baseURL: config.baseUrl,
    apiKey: config.apiKey,
    timeout: config.timeoutMs ?? 60_000,
    maxRetries: config.maxRetries ?? 1,
  });
}

export async function generateJson<T>(
  config: AiRuntimeConfig,
  request: GenerateJsonRequest<T>,
): Promise<T> {
  const client = createClient(config);

  const messages: Array<{ role: "system" | "user"; content: string }> = [];
  if (request.systemPrompt) {
    messages.push({ role: "system", content: request.systemPrompt });
  }
  messages.push({ role: "user", content: request.prompt });

  const response = await client.chat.completions.create({
    model: config.model,
    temperature: config.temperature ?? 0.7,
    messages,
    response_format: { type: "json_object" },
  });

  const text = response.choices[0]?.message?.content;
  if (!text) {
    throw new Error("AI returned empty response");
  }

  return request.parse(JSON.parse(text));
}

export function normalizeNullableString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function normalizeNullableNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const normalized = value.replace(/[,\s]/g, "");
    const parsed = Number(normalized);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

export function normalizeNullableIsoDate(value: unknown): string | null {
  const normalized = normalizeNullableString(value);
  if (!normalized) return null;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

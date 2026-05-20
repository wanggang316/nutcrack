import { inArray } from "drizzle-orm";

import { getDb, schema } from "@nutcrack/db";
import type { AiSettings } from "@nutcrack/shared";

const AI_KEYS = [
  "ai_api_base_url",
  "ai_api_key",
  "ai_model",
  "ai_temperature",
] as const;

export async function getAiSettings(): Promise<AiSettings> {
  const db = getDb();
  const rows = await db
    .select({
      key: schema.settings.key,
      value: schema.settings.value,
      type: schema.settings.type,
    })
    .from(schema.settings)
    .where(inArray(schema.settings.key, [...AI_KEYS]));

  const map: Record<string, string> = {};
  for (const row of rows) {
    map[row.key] = row.value;
  }

  return {
    ai_api_base_url: map.ai_api_base_url || "https://api.openai.com/v1",
    ai_api_key: map.ai_api_key || "",
    ai_model: map.ai_model || "gpt-4o-mini",
    ai_temperature: parseFloat(map.ai_temperature || "0.7"),
  };
}

export async function updateAiSettings(
  input: Partial<AiSettings>,
  userId: string,
): Promise<AiSettings> {
  const now = new Date().toISOString();
  const updates: Array<{
    key: string;
    value: string;
    type: "string" | "number";
  }> = [];

  if (input.ai_api_base_url !== undefined) {
    updates.push({
      key: "ai_api_base_url",
      value: input.ai_api_base_url,
      type: "string",
    });
  }
  if (input.ai_api_key !== undefined) {
    updates.push({
      key: "ai_api_key",
      value: input.ai_api_key,
      type: "string",
    });
  }
  if (input.ai_model !== undefined) {
    updates.push({
      key: "ai_model",
      value: input.ai_model,
      type: "string",
    });
  }
  if (input.ai_temperature !== undefined) {
    updates.push({
      key: "ai_temperature",
      value: String(input.ai_temperature),
      type: "number",
    });
  }

  if (updates.length > 0) {
    const db = getDb();
    db.transaction((tx) => {
      for (const update of updates) {
        tx.insert(schema.settings)
          .values({
            key: update.key,
            value: update.value,
            type: update.type,
            updatedAt: now,
            updatedBy: userId,
          })
          .onConflictDoUpdate({
            target: schema.settings.key,
            set: {
              value: update.value,
              type: update.type,
              updatedAt: now,
              updatedBy: userId,
            },
          })
          .run();
      }
    });
  }

  return getAiSettings();
}

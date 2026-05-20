import { Hono } from "hono";
import type { AppVariables } from "../../types.js";
import { getAiSettings, updateAiSettings } from "../../services/settings.js";
import { successResponse, errorResponse } from "../../lib/utils.js";
import { logError } from "../../lib/logger.js";

const app = new Hono<{ Variables: AppVariables }>();

// GET /api/admin/settings/ai
app.get("/ai", async (c) => {
  try {
    const settings = await getAiSettings();
    // Mask the API key for security
    const masked = {
      ...settings,
      ai_api_key: settings.ai_api_key
        ? settings.ai_api_key.slice(0, 4) +
          "****" +
          settings.ai_api_key.slice(-4)
        : "",
    };
    return c.json(successResponse(masked));
  } catch (err) {
    logError("Get AI settings error", { error: err });
    return c.json(
      errorResponse("INTERNAL_ERROR", "Failed to fetch AI settings"),
      500,
    );
  }
});

// PUT /api/admin/settings/ai
app.put("/ai", async (c) => {
  try {
    const body = await c.req.json();
    const userId = c.get("userId");
    const settings = await updateAiSettings(body, userId);
    const masked = {
      ...settings,
      ai_api_key: settings.ai_api_key
        ? settings.ai_api_key.slice(0, 4) +
          "****" +
          settings.ai_api_key.slice(-4)
        : "",
    };
    return c.json(successResponse(masked));
  } catch (err) {
    logError("Update AI settings error", { error: err });
    return c.json(
      errorResponse("INTERNAL_ERROR", "Failed to update AI settings"),
      500,
    );
  }
});

export default app;

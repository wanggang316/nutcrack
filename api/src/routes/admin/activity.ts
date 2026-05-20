import { Hono } from "hono";
import { getActivityLogs } from "../../services/activity-logs.js";
import { successResponse, errorResponse } from "../../lib/utils.js";
import { logError } from "../../lib/logger.js";

const app = new Hono();

// GET /api/admin/activity-logs
app.get("/", async (c) => {
  try {
    const query = {
      page: Number(c.req.query("page")) || 1,
      page_size: Number(c.req.query("page_size")) || 20,
      action: c.req.query("action"),
      resource: c.req.query("resource"),
    };

    const result = await getActivityLogs(query);
    return c.json(successResponse(result));
  } catch (err) {
    logError("Activity logs error", { error: err });
    return c.json(
      errorResponse("INTERNAL_ERROR", "Failed to fetch activity logs"),
      500,
    );
  }
});

export default app;

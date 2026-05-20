import { Hono } from "hono";
import { getDashboardData } from "../../services/dashboard.js";
import { successResponse, errorResponse } from "../../lib/utils.js";
import { logError } from "../../lib/logger.js";

const app = new Hono();

// GET /api/admin/dashboard
app.get("/", async (c) => {
  try {
    const data = await getDashboardData();
    return c.json(successResponse(data));
  } catch (err) {
    logError("Dashboard error", { error: err });
    return c.json(
      errorResponse("INTERNAL_ERROR", "Failed to fetch dashboard data"),
      500,
    );
  }
});

export default app;

import "dotenv/config";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { serve } from "@hono/node-server";
import { runMigrations } from "@nutcrack/db";
import { adminAuth, tokenAuth } from "./middleware/auth.js";
import { operationLogger } from "./middleware/logger.js";
import { logError, logInfo, logSystemStart } from "./lib/logger.js";
import { parseCorsOrigins } from "./lib/utils.js";
import type { AppVariables } from "./types.js";

// Bootstrap local SQLite schema before the Hono app starts handling requests.
try {
  runMigrations();
} catch (err) {
  logError("DB migration failed at startup", { error: err });
  throw err;
}

import publicLinks from "./routes/public/links.js";
import publicCategories from "./routes/public/categories.js";
import adminAuthRoutes from "./routes/admin/auth.js";
import adminDashboard from "./routes/admin/dashboard.js";
import adminLinks from "./routes/admin/links.js";
import adminPendingLinks from "./routes/admin/pending-links.js";
import adminCategories from "./routes/admin/categories.js";
import adminSettings from "./routes/admin/settings.js";
import adminTokens from "./routes/admin/tokens.js";
import adminActivity from "./routes/admin/activity.js";
import adminDownloads from "./routes/admin/downloads.js";
import authLinks from "./routes/auth/links.js";
import verifyToken from "./routes/auth/verify-token.js";

const app = new Hono<{ Variables: AppVariables }>();

// CORS
app.use(
  "*",
  cors({
    origin: parseCorsOrigins(process.env.CORS_ORIGIN),
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  }),
);

// Global error handler
app.onError((err, c) => {
  logError("Unhandled error", {
    error: err.message,
    stack: err.stack,
    path: c.req.path,
    method: c.req.method,
  });

  return c.json(
    {
      success: false,
      data: null,
      error: {
        code: "INTERNAL_ERROR",
        message:
          process.env.NODE_ENV === "production"
            ? "An unexpected error occurred"
            : err.message || "Unknown error",
        details:
          process.env.NODE_ENV === "production"
            ? null
            : {
                stack: err.stack,
              },
      },
      meta: {
        request_id: crypto.randomUUID(),
      },
    },
    500,
  );
});

// Request logger
app.use("*", async (c, next) => {
  const start = Date.now();
  const method = c.req.method;
  const path = c.req.path;

  await next();

  const duration = Date.now() - start;
  const status = c.res.status;

  logInfo("Request", { method, path, status, duration });
});

// Operation logger
app.use("/api/*", operationLogger);

// Public routes
app.route("/api/links", publicLinks);
app.route("/api/categories", publicCategories);

// Admin auth routes (no auth required for login/setup)
app.route("/api/admin/auth", adminAuthRoutes);

// Admin routes (auth required) - create a sub-app with auth middleware
const adminApp = new Hono<{ Variables: AppVariables }>();
adminApp.use("*", adminAuth);
adminApp.route("/dashboard", adminDashboard);
adminApp.route("/links", adminLinks);
adminApp.route("/pending-links", adminPendingLinks);
adminApp.route("/categories", adminCategories);
adminApp.route("/settings", adminSettings);
adminApp.route("/tokens", adminTokens);
adminApp.route("/activity-logs", adminActivity);
adminApp.route("/downloads", adminDownloads);
app.route("/api/admin", adminApp);

// External auth routes (token auth required)
app.use("/api/auth/*", tokenAuth);
app.route("/api/auth/links", authLinks);
app.route("/api/auth/tokens/verify", verifyToken);

// Health check
app.get("/api/health", (c) =>
  c.json({ status: "ok", timestamp: new Date().toISOString() }),
);

const port = Number(process.env.PORT) || 3000;

if (!process.env.VERCEL) {
  logSystemStart();
  serve({ fetch: app.fetch, port }, () => {
    console.log(`Nutcrack API running on http://localhost:${port}`);
  });
}

export default app;

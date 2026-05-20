import { Hono } from "hono";
import { successResponse } from "../../lib/utils.js";

const app = new Hono();

// GET /api/admin/downloads
app.get("/", async (c) => {
  const items = [
    {
      id: "chrome-extension",
      name: "Chrome Extension",
      description: "Chrome browser extension for one-click link saving",
      type: "browser_extension",
      status: "coming_soon",
      download_url: null,
    },
    {
      id: "mobile-app",
      name: "Mobile App",
      description: "Mobile application (planned)",
      type: "mobile_app",
      status: "coming_soon",
      download_url: null,
    },
  ];

  return c.json(successResponse({ items }));
});

export default app;

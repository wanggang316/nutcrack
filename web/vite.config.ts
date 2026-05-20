import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const webPort = Number(env.PORT || 5173);
  const apiProxyTarget = env.VITE_API_PROXY_TARGET || "http://127.0.0.1:3000";

  return {
    plugins: [react()],
    server: {
      port: webPort,
      proxy: {
        "/api": {
          target: apiProxyTarget,
          changeOrigin: true,
        },
        "/feed.xml": {
          target: apiProxyTarget,
          changeOrigin: true,
        },
        "/feed.json": {
          target: apiProxyTarget,
          changeOrigin: true,
        },
      },
    },
    resolve: {
      alias: {
        "@nutcrack/shared": new URL("../packages/shared/src", import.meta.url)
          .pathname,
      },
    },
  };
});

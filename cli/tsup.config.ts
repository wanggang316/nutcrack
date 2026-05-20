import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  platform: "node",
  target: "node18",
  bundle: true,
  splitting: false,
  sourcemap: false,
  clean: true,
  outDir: "dist",
  noExternal: ["@nutcrack/shared"],
});

import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  platform: "node",
  target: "es2022",
  bundle: true,
  splitting: false,
  sourcemap: false,
  clean: true,
  dts: true,
  outDir: "dist",
});

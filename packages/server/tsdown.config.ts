import { defineConfig } from "tsdown";

export default defineConfig({
  entry: "src/index.ts",
  outDir: "dist",
  format: "esm",
  platform: "node",
  target: "es2022",
  fixedExtension: false,
  unbundle: true,
  dts: true,
  clean: true,
  publint: { level: "error" },
  attw: { level: "error" },
  exports: false,
  minify: false,
  treeshake: false,
});

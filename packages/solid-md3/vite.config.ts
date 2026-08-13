import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { nodeExternals } from "rollup-plugin-node-externals";
import dts from "unplugin-dts/vite";
import { defineConfig } from "vite";
import solid from "vite-plugin-solid";

export default defineConfig({
  plugins: [
    nodeExternals({
      packagePath: path.resolve(import.meta.dirname, "package.json"),
    }),
    solid(),
    tailwindcss(),
    dts({
      copyDtsFiles: true,
      beforeWriteFile(filePath, content) {
        if (path.basename(filePath) === "index.d.ts") {
          return {
            content: `/// <reference path="./types.d.ts" />\n${content}`,
          };
        }
      },
    }),
  ],
  build: {
    lib: {
      entry: path.resolve(import.meta.dirname, "src/index.ts"),
      formats: ["es"],
      fileName: "index",
      cssFileName: "styles",
    },
    outDir: "dist",
    sourcemap: true,
  },
});

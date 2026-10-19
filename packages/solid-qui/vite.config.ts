import pandacss from "@pandacss/vite";
import path from "path";
import { nodeExternals } from "rollup-plugin-node-externals";
import dts from "unplugin-dts/vite";
import { defineConfig } from "vite";
import solid from "vite-plugin-solid";

const root = path.resolve(import.meta.dirname);

export default defineConfig({
  plugins: [
    nodeExternals({
      packagePath: path.resolve(root, "package.json"),
    }),
    pandacss({ transform: true }),
    solid(),
    dts({
      entryRoot: "src",
      include: ["src"],
      exclude: ["**/*.styles.ts"],
      copyDtsFiles: true,
    }),
  ],
  build: {
    lib: {
      entry: path.resolve(root, "src/index.ts"),
      formats: ["es"],
      fileName: "index",
    },
    outDir: "dist",
    sourcemap: false,
  },
});

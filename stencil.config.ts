/// <reference types="node" />
import type { Config } from "@stencil/core";

import pandacss from "@pandacss/rollup";
import { join } from "node:path";

import { stylesPlugin } from "./styles.stencil.plugin";

const packageRoot = __dirname;
const styleStrategy = process.env.MD3_STYLE_STRATEGY === "split" ? "split" : "shared";

const globalCss =
  styleStrategy === "split"
    ? join(packageRoot, "styled-system/base.css")
    : join(packageRoot, "styled-system/styles.css");
const outputDirectory = join(packageRoot, "dist", styleStrategy);

export const config: Config = {
  namespace: "qui",
  plugins: [stylesPlugin({ root: packageRoot, strategy: styleStrategy })],
  outputTargets: [
    {
      type: "www",
      serviceWorker: null,
      copy: [
        { src: globalCss, dest: "styles.css" },
        { src: join(packageRoot, "styled-system/theme.css"), dest: "theme.css" },
      ],
    },
    {
      type: "dist-custom-elements",
      dir: outputDirectory,
      generateTypeDeclarations: true,
      customElementsExportBehavior: "single-export-module",
    },
  ],
  rollupPlugins: {
    before: [...pandacss({ transform: true, fileName: "panda-generated.css" })],
  },
  testing: { browserHeadless: "shell" },
};

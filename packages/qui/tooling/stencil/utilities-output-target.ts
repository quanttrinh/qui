import type { OutputTargetCustom } from "@stencil/core/internal";

import { relative } from "node:path";
import { build } from "tsdown";

import { type Config } from "../config";

/** Compiles the public utility entry points as standalone ESM modules. */
export function utilitiesOutputTarget(config: Config): OutputTargetCustom {
  return {
    type: "custom",
    name: "qui-utilities",
    async generator() {
      const source = relative(config.root, config.source.utilities).split("\\").join("/");
      const output = relative(config.root, config.output.utilities).split("\\").join("/");

      await build({
        cwd: config.root,
        entry: [`${source}/**/*.ts`, `!${source}/**/*.test.ts`],
        outDir: output,
        format: "esm",
        platform: "neutral",
        target: "es2022",
        fixedExtension: false,
        unbundle: true,
        dts: true,
        clean: true,
        exports: false,
        minify: false,
        treeshake: false,
      });
      console.log("[qui] built utility modules");
    },
  };
}

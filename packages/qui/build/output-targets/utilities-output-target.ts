import type { OutputTargetCustom } from "@stencil/core/internal";

import { relative } from "node:path";

import { buildModules } from "../../../../tooling/module-builder";
import { type BuildConfig } from "../config";

/** Compiles the public utility entry points as standalone ESM modules. */
export function utilitiesOutputTarget(config: BuildConfig): OutputTargetCustom {
  return {
    type: "custom",
    name: "qui-utilities",
    async generator() {
      const count = await buildModules({
        root: config.root,
        source: relative(config.root, config.source.utilities),
        output: relative(config.root, config.output.utilities),
      });
      console.log(`[qui] compiled ${count} utility module(s)`);
    },
  };
}

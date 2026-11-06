import type { Plugin } from "rollup";

/// <reference types="node" />
import { createNodeLogger } from "@stencil/core/sys/node";
import { createRequire } from "node:module";

import { type Config } from "../../config";
import { type PandaDriver } from "../../panda/panda-driver";

type Options = {
  config: Config;
  driver: PandaDriver;
  logger: ReturnType<typeof createNodeLogger>;
};

/**
 * Runs only Panda's source transformer. `stylesPlugin` owns codegen and CSS
 * generation; both use the same shared compiler driver.
 */
export function pandacssTransform({ config, driver }: Options): Plugin[] {
  const requireFromRoot = createRequire(config.file.packageJson);
  const pandaTransformer = requireFromRoot(
    "@pandacss/transformer",
  ) as typeof import("@pandacss/transformer");
  const transformer = pandaTransformer.rollup({ getCompiler: () => driver.getCompiler() });
  const transformerPlugins = Array.isArray(transformer) ? transformer : [transformer];

  return [
    {
      name: "qui-panda-transform",
      async buildStart(): Promise<void> {
        await driver.ensureMain();
      },
    },
    ...transformerPlugins,
  ];
}

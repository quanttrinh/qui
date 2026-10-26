/// <reference types="node" />
import type { Config } from "@stencil/core";

import { createNodeLogger } from "@stencil/core/sys/node";
import { createRequire } from "node:module";
import { join } from "node:path";

import { createPandaDriver } from "./build/panda-driver";
import { stylesPlugin } from "./styles.stencil.plugin";

const packageRoot = __dirname;
const requireFromConfig = createRequire(join(packageRoot, "package.json"));
const pandaTransformer = requireFromConfig(
  "@pandacss/transformer",
) as typeof import("@pandacss/transformer");
const logger = createNodeLogger();
const pandaDriver = createPandaDriver(packageRoot);
const globalCss = join(packageRoot, "styled-system/styles.css");
const outputDirectory = join(packageRoot, "dist", "shared");

const testSourceFile = /\.(?:test|spec|e2e)\.(?:ts|tsx)$/;
const testSupportPath = /(?:^|\/)(?:test-utils|vitest\.(?:config|setup)\.ts)(?:\/|$)/;
const isTestBuild = process.env.NODE_ENV === "test";

/**
 * Runs only Panda's source transformer. `stylesPlugin` owns codegen and CSS
 * generation; both use the same shared compiler driver.
 */
function pandacssTransform(driver: ReturnType<typeof createPandaDriver>) {
  const transformer = pandaTransformer.rollup({ getCompiler: () => driver.getCompiler() });
  const transformerPlugins = Array.isArray(transformer) ? transformer : [transformer];

  return [
    {
      name: "qui-panda-transform",
      async buildStart(): Promise<void> {
        await driver.ensureMain();
      },
    },
    ...(transformerPlugins as unknown[]),
  ];
}

export const config: Config = {
  namespace: "qui",
  logger,
  plugins: [stylesPlugin({ root: packageRoot, driver: pandaDriver, logger })],
  tsconfig: "./tsconfig.build.json",
  // Tests and Vitest setup are not part of the component build.
  watchIgnoredRegex: [testSourceFile, testSupportPath],
  outputTargets: [
    isTestBuild
      ? {
          type: "www" as const,
          dir: join(packageRoot, ".stencil-test"),
          serviceWorker: null,
        }
      : {
          type: "www" as const,
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
      externalRuntime: false,
    },
    {
      type: "dist-hydrate-script",
      dir: join(packageRoot, "dist", "hydrate", "shared"),
    },
  ],
  rollupPlugins: {
    before: pandacssTransform(pandaDriver),
  },
};

/// <reference types="node" />
import type { Compiler, NodeDriver } from "@pandacss/compiler";

import { createRequire } from "node:module";
import { join } from "node:path";

import { stripRootLayerOrder } from "./css";

/** Shared Panda compiler and stylesheet generation for the build and transformer. */
export interface PandaDriver {
  /** Compiler used by `@pandacss/transformer`, once the main driver is ready. */
  getCompiler: () => Compiler | undefined;
  /** Creates the main driver before the transformer runs. */
  ensureMain: () => Promise<void>;
  /** Regenerates the main stylesheet and returns its CSS. */
  generateStyles: () => Promise<string>;
  /** Reloads the driver after a config change. */
  reload: () => Promise<void>;
}

/**
 * Creates the shared Panda driver.
 *
 * The initial `panda codegen` bootstrap must stay synchronous because Stencil
 * needs `styled-system/css` and the style-url module before it scans component
 * decorators. The drivers below handle CSS generation and transform work.
 */
export function createPandaDriver(root: string): PandaDriver {
  const requireFromRoot = createRequire(join(root, "package.json"));
  const { createNodeDriver } = requireFromRoot(
    "@pandacss/compiler",
  ) as typeof import("@pandacss/compiler");

  let mainDriver: NodeDriver | undefined;
  let mainPromise: Promise<NodeDriver> | undefined;

  async function ensureMainDriver(): Promise<NodeDriver> {
    mainPromise ??= createNodeDriver({ cwd: root, configPath: "panda.config.ts" }).then(
      (driver) => {
        mainDriver = driver;
        return driver;
      },
    );
    return mainPromise;
  }

  return {
    getCompiler: () => mainDriver?.compiler,
    async ensureMain(): Promise<void> {
      await ensureMainDriver();
    },
    async generateStyles(): Promise<string> {
      const driver = await ensureMainDriver();
      driver.parseFiles();
      return stripRootLayerOrder(driver.cssgen({ minify: true }).css);
    },
    async reload(): Promise<void> {
      if (mainPromise !== undefined) {
        await mainDriver?.reload();
      }
    },
  };
}

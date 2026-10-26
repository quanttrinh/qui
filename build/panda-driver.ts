/// <reference types="node" />
import type { Compiler, NodeDriver } from "@pandacss/compiler";

import { createRequire } from "node:module";
import { join } from "node:path";

/** Shared Panda compiler and stylesheet generation for the build and transformer. */
export interface PandaDriver {
  /** Compiler used by `@pandacss/transformer`, once the main driver is ready. */
  getCompiler: () => Compiler | undefined;
  /** Creates the main driver before the transformer runs. */
  ensureMain: () => Promise<void>;
  /** Regenerates the main stylesheet and returns its CSS. */
  generateStyles: () => Promise<string>;
  /** Regenerates the theme stylesheet and returns its CSS. */
  generateTheme: () => Promise<string>;
  /** Reloads either driver after a config change. */
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
  let themeDriver: NodeDriver | undefined;
  let themePromise: Promise<NodeDriver> | undefined;

  async function ensureMainDriver(): Promise<NodeDriver> {
    mainPromise ??= createNodeDriver({ cwd: root, configPath: "panda.config.ts" }).then(
      (driver) => {
        mainDriver = driver;
        return driver;
      },
    );
    return mainPromise;
  }

  async function ensureThemeDriver(): Promise<NodeDriver> {
    themePromise ??= createNodeDriver({
      cwd: root,
      configPath: "panda.theme.config.ts",
    }).then((driver) => {
      themeDriver = driver;
      return driver;
    });
    return themePromise;
  }

  return {
    getCompiler: () => mainDriver?.compiler,
    async ensureMain(): Promise<void> {
      await ensureMainDriver();
    },
    async generateStyles(): Promise<string> {
      const driver = await ensureMainDriver();
      driver.parseFiles();
      return driver.cssgen({ minify: true }).css;
    },
    async generateTheme(): Promise<string> {
      const driver = await ensureThemeDriver();
      return driver.cssgen({ minify: true }).css;
    },
    async reload(): Promise<void> {
      if (mainPromise !== undefined) {
        await mainDriver?.reload();
      }
      if (themePromise !== undefined) {
        await themeDriver?.reload();
      }
    },
  };
}

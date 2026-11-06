import type { Logger as StencilLogger, OutputTargetCustom } from "@stencil/core/internal";

import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { readFile, readdir } from "node:fs/promises";
import { join, relative } from "node:path";
import { build, type Logger as TsdownLogger } from "tsdown";

import { type Config } from "../config";

const UTILITY_SOURCE = /\.(?:[cm]?[jt]sx?)$/u;
const EXCLUDED_SOURCE = /(?:\.test|\.spec|\.e2e)\.(?:[cm]?[jt]sx?)$/u;

let lastSourceHash: string | undefined;

/**
 * Adapts Stencil's logger to tsdown's logger contract so utility builds report
 * through the same output instead of a second console logger.
 */
function createTsdownLogger(logger: StencilLogger): TsdownLogger {
  const warned = new Set<string>();
  const level = logger.getLevel() === "debug" ? "info" : logger.getLevel();
  const format = (messages: unknown[]): string =>
    messages.filter((message) => message !== undefined && message !== false).join(" ");
  return {
    level,
    options: { allowClearScreen: false },
    info: (...messages: unknown[]) => logger.info(format(messages)),
    warn: (...messages: unknown[]) => logger.warn(format(messages)),
    warnOnce: (...messages: unknown[]) => {
      const text = format(messages);
      if (!warned.has(text)) {
        warned.add(text);
        logger.warn(text);
      }
    },
    error: (...messages: unknown[]) => {
      logger.error(format(messages));
      process.exitCode = 1;
    },
    success: (...messages: unknown[]) => logger.info(format(messages)),
    clearScreen: () => undefined,
  };
}

/** Hashes the utility sources so watch rebuilds skip unchanged output. */
async function utilitySourceHash(source: string): Promise<string> {
  const files = (await readdir(source, { recursive: true }))
    .filter((file) => UTILITY_SOURCE.test(file) && !EXCLUDED_SOURCE.test(file))
    .sort();
  const digest = createHash("sha1");
  for (const file of files) {
    digest.update(file).update(await readFile(join(source, file)));
  }
  return digest.digest("hex");
}

/** Compiles the public utility entry points as standalone ESM modules. */
export function utilitiesOutputTarget(config: Config, logger?: StencilLogger): OutputTargetCustom {
  return {
    type: "custom",
    name: "qui-utilities",
    async generator() {
      const source = relative(config.root, config.source.utilities).split("\\").join("/");
      const output = relative(config.root, config.output.utilities).split("\\").join("/");
      const hash = await utilitySourceHash(config.source.utilities);
      // `h.ts` is a fixed utility entry, so a successful build always emits it.
      const built = existsSync(join(config.output.utilities, "h.js"));

      if (hash === lastSourceHash && built) {
        return;
      }

      await build({
        cwd: config.root,
        entry: [
          `${source}/**/*.{ts,tsx,mts,cts}`,
          `!${source}/**/*.{test,spec,e2e}.{ts,tsx,mts,cts}`,
        ],
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
        ...(logger === undefined ? {} : { customLogger: createTsdownLogger(logger) }),
      });
      lastSourceHash = hash;
    },
  };
}

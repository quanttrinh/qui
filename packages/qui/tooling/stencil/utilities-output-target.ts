import type { OutputTargetCustom } from "@stencil/core/internal";

import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { readFile, readdir } from "node:fs/promises";
import { join, relative } from "node:path";
import { build } from "tsdown";

import { type Config } from "../config";

const UTILITY_SOURCE = /\.(?:[cm]?[jt]sx?)$/u;
const EXCLUDED_SOURCE = /(?:\.test|\.spec|\.e2e)\.(?:[cm]?[jt]sx?)$/u;

let lastSourceHash: string | undefined;

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
export function utilitiesOutputTarget(config: Config): OutputTargetCustom {
  return {
    type: "custom",
    name: "qui-utilities",
    async generator() {
      const source = relative(config.root, config.source.utilities).split("\\").join("/");
      const output = relative(config.root, config.output.utilities).split("\\").join("/");
      const hash = await utilitySourceHash(config.source.utilities);

      if (hash === lastSourceHash && existsSync(config.output.utilities)) {
        return;
      }
      lastSourceHash = hash;

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
      });
      console.log("[qui] built utility modules");
    },
  };
}

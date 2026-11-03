/// <reference types="node" />
import type { OutputTargetCustom } from "@stencil/core";

import {
  createPreactTypes,
  createReactTypes,
  createSolidTypes,
} from "@stencil/types-output-target";
import { readFileSync } from "node:fs";
import { basename, join, relative } from "node:path";

interface FrameworkTypesOutputTargetOptions {
  rootDir: string;
}

interface FrameworkWriter {
  readonly file: string;
  readonly create: typeof createReactTypes;
}

/**
 * Generate React, Solid, and Preact declarations with the correct package name.
 *
 * `typesOutputTarget()` in @stencil/types-output-target 1.0.2 reads the package
 * manifest through an uninitialized `fs` shim, catches the failure, and falls
 * back to the Stencil namespace. The generator functions themselves are fine,
 * so this output target supplies the package name directly.
 */
export function frameworkTypesOutputTarget(
  options: FrameworkTypesOutputTargetOptions,
): OutputTargetCustom {
  return {
    type: "custom",
    name: "framework-types-output-target",
    async generator(config, compilerCtx, buildCtx) {
      const manifest = JSON.parse(readFileSync(config.packageJsonFilePath, "utf8")) as {
        name?: string;
      };
      const stencilPackageName = manifest.name;

      if (stencilPackageName === undefined || stencilPackageName.length === 0) {
        throw new Error("[qui] package.json is missing a package name");
      }

      const writers: FrameworkWriter[] = [
        {
          file: "react.d.ts",
          create: createReactTypes,
        },
        {
          file: "solid.d.ts",
          create: createSolidTypes,
        },
        {
          file: "preact.d.ts",
          create: createPreactTypes,
        },
      ];

      await Promise.all(
        writers.map(async ({ file, create }) => {
          const path = join(options.rootDir, "dist", "types", file);
          const content = create({
            components: buildCtx.components,
            stencilPackageName,
            importPath: `types/${basename(file, ".d.ts")}`,
            typesFilePath: relative(options.rootDir, path),
          });

          if (content.length > 0) {
            await compilerCtx.fs.writeFile(path, content);
          }
        }),
      );
    },
  };
}

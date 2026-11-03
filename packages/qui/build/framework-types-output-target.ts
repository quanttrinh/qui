/// <reference types="node" />
import type { OutputTargetCustom } from "@stencil/core";

import {
  createPreactTypes,
  createReactTypes,
  createSolidTypes,
} from "@stencil/types-output-target";
import { readFileSync } from "node:fs";
import { join, relative, sep } from "node:path";

interface FrameworkTypesOutputTargetOptions {
  rootDir: string;
}

interface FrameworkWriter {
  readonly name: "preact" | "react" | "solid";
  readonly create: typeof createReactTypes;
}

const FRAMEWORK_WRITERS: readonly FrameworkWriter[] = [
  {
    name: "react",
    create: createReactTypes,
  },
  {
    name: "solid",
    create: createSolidTypes,
  },
  {
    name: "preact",
    create: createPreactTypes,
  },
];

// The generated declarations are type-only. This stub keeps the documented
// side-effect import resolvable by bundlers at runtime.
const RUNTIME_STUB = "// Runtime stub for the type-only framework entry point.\nexport {};\n";

/**
 * Generate React, Solid, and Preact declarations with the correct package name.
 *
 * `typesOutputTarget()` in @stencil/types-output-target 1.0.2 reads the package
 * manifest through an uninitialized `fs` shim, catches the failure, and falls
 * back to the Stencil namespace. The generator functions themselves are fine,
 * so this output target supplies the package name directly.
 *
 * Remove this workaround once the upstream package reads the manifest
 * correctly.
 */
export function frameworkTypesOutputTarget(
  options: FrameworkTypesOutputTargetOptions,
): OutputTargetCustom {
  return {
    type: "custom",
    name: "framework-types-output-target",
    async generator(config, compilerCtx, buildCtx) {
      const packageJsonPath = config.packageJsonFilePath;
      if (packageJsonPath === undefined) {
        throw new Error("[qui] Stencil did not provide a package.json path");
      }

      const manifest = JSON.parse(readFileSync(packageJsonPath, "utf8")) as {
        name?: string;
      };
      const stencilPackageName = manifest.name;

      if (stencilPackageName === undefined || stencilPackageName.length === 0) {
        throw new Error("[qui] package.json is missing a package name");
      }

      await Promise.all(
        FRAMEWORK_WRITERS.map(async ({ name, create }) => {
          const declarationPath = join(options.rootDir, "dist", "types", `${name}.d.ts`);
          const content = create({
            components: buildCtx.components,
            stencilPackageName,
            importPath: `types/${name}`,
            typesFilePath: relative(options.rootDir, declarationPath).split(sep).join("/"),
          });

          if (content.length > 0) {
            await compilerCtx.fs.writeFile(declarationPath, content);
          }

          await compilerCtx.fs.writeFile(
            join(options.rootDir, "dist", "types", `${name}.js`),
            RUNTIME_STUB,
          );
        }),
      );
    },
  };
}

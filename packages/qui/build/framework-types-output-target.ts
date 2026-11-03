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
 * Preact only lowercases handler names for built-in DOM events. For custom
 * elements it calls `addEventListener` with the exact remainder after the `on`
 * prefix, so a `checkedchange` event must be exposed as `oncheckedchange`, not
 * `onCheckedchange`. The upstream Preact generator capitalizes the event name;
 * rewrite the generated handler keys back to the real event names.
 */
function normalizePreactEventNames(
  content: string,
  components: readonly {
    readonly events?: readonly { readonly name: string }[];
  }[],
): string {
  let normalized = content;

  for (const component of components) {
    for (const event of component.events ?? []) {
      const generated = `on${event.name.charAt(0).toUpperCase()}${event.name.slice(1)}`;
      normalized = normalized.replaceAll(`'${generated}'`, `'on${event.name}'`);
    }
  }

  return normalized;
}

/**
 * Generate React, Solid, and Preact declarations under the `/types/*` entry
 * points.
 *
 * We cannot use the upstream `typesOutputTarget()` as-is for two reasons:
 *
 * 1. It derives `importPath` from the declaration file's basename, so a file at
 *    `dist/types/react.d.ts` would import `@quanttrinh/qui/react` instead of
 *    `@quanttrinh/qui/types/react`.
 * 2. In 1.0.2 its package-name lookup calls `readFileSync` on an empty shim
 *    object, so it always falls back to the Stencil namespace instead of the
 *    package name. See
 *    https://unpkg.com/@stencil/types-output-target@1.0.2/dist/index.js
 *
 * Remove this workaround when the upstream target supports custom import paths
 * and reads the manifest reliably.
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
        name?: unknown;
      };
      const stencilPackageName = manifest.name;

      if (typeof stencilPackageName !== "string" || stencilPackageName.length === 0) {
        throw new Error("[qui] package.json is missing a valid package name");
      }

      await Promise.all(
        FRAMEWORK_WRITERS.map(async ({ name, create }) => {
          const declarationPath = join(options.rootDir, "dist", "types", `${name}.d.ts`);
          const generated = create({
            components: buildCtx.components,
            stencilPackageName,
            importPath: `types/${name}`,
            typesFilePath: relative(options.rootDir, declarationPath).split(sep).join("/"),
          });
          const content =
            name === "preact"
              ? normalizePreactEventNames(generated, buildCtx.components)
              : generated;

          if (content.length === 0) {
            throw new Error(`[qui] no ${name} declarations were generated`);
          }

          await compilerCtx.fs.writeFile(declarationPath, content);
          await compilerCtx.fs.writeFile(
            join(options.rootDir, "dist", "types", `${name}.js`),
            RUNTIME_STUB,
          );
        }),
      );
    },
  };
}

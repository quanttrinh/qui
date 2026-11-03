/// <reference types="node" />
import type { OutputTargetCustom } from "@stencil/core";

import {
  createPreactTypes,
  createReactTypes,
  createSolidTypes,
} from "@stencil/types-output-target";
import { readFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import * as ts from "typescript";

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

interface TextEdit {
  readonly start: number;
  readonly end: number;
  readonly text: string;
}

/**
 * Normalize the upstream Preact declarations for current Preact versions.
 *
 * 1. Preact only lowercases handler names for built-in DOM events in v10. For
 *    custom elements it calls `addEventListener` with the exact remainder after
 *    the `on` prefix, so `checkedchange` must be exposed as `oncheckedchange`,
 *    not `onCheckedchange`. The upstream generator capitalizes event names.
 * 2. Preact 11 removed `HTMLAttributes` from the `JSX` namespace. It remains a
 *    top-level export in both v10 and v11, so use that instead of
 *    `JSX.HTMLAttributes`.
 */
function normalizePreactDeclarations(
  content: string,
  components: readonly {
    readonly events?: readonly { readonly internal?: boolean; readonly name: string }[];
  }[],
): string {
  const eventNames = new Map<string, string>();

  for (const component of components) {
    for (const event of component.events ?? []) {
      if (event.internal === true) {
        continue;
      }

      const generated = `on${event.name.charAt(0).toUpperCase()}${event.name.slice(1)}`;
      const replacement = `on${event.name}`;
      const existing = eventNames.get(generated);

      if (existing !== undefined && existing !== replacement) {
        throw new Error(`[qui] conflicting Preact event names: "${existing}" and "${replacement}"`);
      }

      eventNames.set(generated, replacement);
    }
  }

  const sourceFile = ts.createSourceFile(
    "preact.d.ts",
    content,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );

  if (sourceFile.parseDiagnostics.length > 0) {
    const diagnostics = sourceFile.parseDiagnostics
      .map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"))
      .join("; ");
    throw new Error(`[qui] failed to parse generated Preact declarations: ${diagnostics}`);
  }

  const edits: TextEdit[] = [];
  let renamedImport = false;

  function visit(node: ts.Node): void {
    if (
      ts.isImportDeclaration(node) &&
      ts.isStringLiteral(node.moduleSpecifier) &&
      node.moduleSpecifier.text === "preact" &&
      node.importClause?.namedBindings !== undefined &&
      ts.isNamedImports(node.importClause.namedBindings)
    ) {
      const elements = node.importClause.namedBindings.elements;
      const importsHTMLAttributes = elements.some(
        (specifier) => (specifier.propertyName ?? specifier.name).text === "HTMLAttributes",
      );

      for (const specifier of elements) {
        if ((specifier.propertyName ?? specifier.name).text !== "JSX") {
          continue;
        }

        if (specifier.propertyName !== undefined) {
          throw new Error("[qui] unexpected aliased JSX import in Preact declarations");
        }

        if (!importsHTMLAttributes && !renamedImport) {
          edits.push({
            start: specifier.name.getStart(sourceFile),
            end: specifier.name.getEnd(),
            text: "HTMLAttributes",
          });
          renamedImport = true;
        }
      }
    } else if (
      ts.isTypeReferenceNode(node) &&
      ts.isQualifiedName(node.typeName) &&
      node.typeName.left.getText(sourceFile) === "JSX" &&
      node.typeName.right.text === "HTMLAttributes"
    ) {
      edits.push({
        start: node.typeName.getStart(sourceFile),
        end: node.typeName.getEnd(),
        text: "HTMLAttributes",
      });
    } else if (ts.isPropertySignature(node) && ts.isStringLiteral(node.name)) {
      const replacement = eventNames.get(node.name.text);
      if (replacement !== undefined) {
        edits.push({
          start: node.name.getStart(sourceFile),
          end: node.name.getEnd(),
          text: `'${replacement}'`,
        });
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  const sorted = edits.sort((left, right) => left.start - right.start);
  const parts: string[] = [];
  let cursor = 0;

  for (const edit of sorted) {
    if (edit.start < cursor) {
      throw new Error("[qui] overlapping edits in generated Preact declarations");
    }
    parts.push(content.slice(cursor, edit.start), edit.text);
    cursor = edit.end;
  }

  parts.push(content.slice(cursor));
  return parts.join("");
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
              ? normalizePreactDeclarations(generated, buildCtx.components)
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

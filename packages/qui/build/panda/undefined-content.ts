/// <reference types="node" />
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import * as ts from "typescript";

import { type BuildConfig } from "../config";

const UNDEFINED_CONTENT_TAG = "undefinedContent";

function hasUndefinedContentMarker(node: ts.ClassDeclaration): boolean {
  return ts.getJSDocTags(node).some((tag) => tag.tagName.text === UNDEFINED_CONTENT_TAG);
}

function componentTag(node: ts.ClassDeclaration, source: ts.SourceFile): string | undefined {
  const decorator = (ts.getDecorators(node) ?? []).find((candidate) => {
    const expression = candidate.expression;
    return ts.isCallExpression(expression) && expression.expression.getText(source) === "Component";
  });
  if (decorator === undefined || !ts.isCallExpression(decorator.expression)) {
    return undefined;
  }
  const [options] = decorator.expression.arguments;
  if (options === undefined || !ts.isObjectLiteralExpression(options)) {
    return undefined;
  }
  const tag = options.properties.find(
    (property): property is ts.PropertyAssignment =>
      ts.isPropertyAssignment(property) && property.name.getText(source) === "tag",
  );
  return tag !== undefined && ts.isStringLiteralLike(tag.initializer)
    ? tag.initializer.text
    : undefined;
}

/**
 * Collects the tags of components marked with `@undefinedContent` in their
 * class documentation. The marker keeps the metadata beside the component
 * instead of duplicating its tag in a build-time list.
 */
function discoverUndefinedContentTags(config: BuildConfig): string[] {
  const tags = new Set<string>();

  for (const file of readdirSync(config.source.components, { encoding: "utf8", recursive: true })) {
    if (!file.endsWith(".tsx")) {
      continue;
    }
    const path = join(config.source.components, file);
    const source = ts.createSourceFile(
      path,
      readFileSync(path, "utf8"),
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX,
    );

    const visit = (node: ts.Node): void => {
      if (ts.isClassDeclaration(node) && hasUndefinedContentMarker(node)) {
        const tag = componentTag(node, source);
        if (tag !== undefined) {
          tags.add(tag);
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(source);
  }

  return [...tags].sort();
}

/** Content hosts that have no useful pre-upgrade state. */
function undefinedContentTags(config: BuildConfig): string[] {
  return discoverUndefinedContentTags(config);
}

/**
 * Suppresses content while its custom element is undefined, but keeps
 * server-rendered hosts visible through Stencil's `hydrated` marker.
 */
function undefinedContentSelector(config: BuildConfig): string {
  return `:where(${undefinedContentTags(config).join(", ")}):not(:defined):not(.hydrated)`;
}

export { undefinedContentSelector, undefinedContentTags };

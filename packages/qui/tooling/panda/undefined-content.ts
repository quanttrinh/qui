/// <reference types="node" />
import { parse, type ParserPlugin } from "@babel/parser";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { type Config } from "../config";

const PARSE_PLUGINS: ParserPlugin[] = ["typescript", "jsx", "decorators-legacy"];
const SKIPPED_AST_KEYS = new Set([
  "comments",
  "end",
  "extra",
  "innerComments",
  "leadingComments",
  "loc",
  "start",
  "tokens",
  "trailingComments",
]);
const UNDEFINED_CONTENT_MARKER = /@undefinedContent\b/u;

interface AstNode {
  type: string;
  [key: string]: unknown;
}

function isAstNode(value: unknown): value is AstNode {
  return (
    typeof value === "object" && value !== null && typeof Reflect.get(value, "type") === "string"
  );
}

function visitNodes(value: unknown, visit: (node: AstNode) => void): void {
  if (Array.isArray(value)) {
    for (const item of value) {
      visitNodes(item, visit);
    }
    return;
  }
  if (!isAstNode(value)) {
    return;
  }

  visit(value);
  for (const [key, child] of Object.entries(value)) {
    if (key !== "type" && !SKIPPED_AST_KEYS.has(key)) {
      visitNodes(child, visit);
    }
  }
}

function componentTag(node: AstNode): string | undefined {
  const decorators: unknown = Reflect.get(node, "decorators");
  if (!Array.isArray(decorators)) {
    return undefined;
  }

  for (const decorator of decorators) {
    if (!isAstNode(decorator)) {
      continue;
    }
    const expression: unknown = Reflect.get(decorator, "expression");
    if (!isAstNode(expression) || expression.type !== "CallExpression") {
      continue;
    }

    const callee: unknown = Reflect.get(expression, "callee");
    if (
      !isAstNode(callee) ||
      callee.type !== "Identifier" ||
      Reflect.get(callee, "name") !== "Component"
    ) {
      continue;
    }

    const args: unknown = Reflect.get(expression, "arguments");
    if (!Array.isArray(args)) {
      continue;
    }
    const options = args[0];
    if (!isAstNode(options) || options.type !== "ObjectExpression") {
      continue;
    }

    const properties: unknown = Reflect.get(options, "properties");
    if (!Array.isArray(properties)) {
      continue;
    }

    for (const property of properties) {
      if (!isAstNode(property) || property.type !== "ObjectProperty") {
        continue;
      }
      const key: unknown = Reflect.get(property, "key");
      if (!isAstNode(key) || Reflect.get(key, "name") !== "tag") {
        continue;
      }
      const value: unknown = Reflect.get(property, "value");
      if (!isAstNode(value) || value.type !== "StringLiteral") {
        continue;
      }
      const tag: unknown = Reflect.get(value, "value");
      if (typeof tag === "string") {
        return tag;
      }
    }
  }

  return undefined;
}

/**
 * Collects the tags of components marked with `@undefinedContent` in their
 * class documentation. The marker keeps the metadata beside the component
 * instead of duplicating its tag in a build-time list.
 */
function undefinedContentTags(config: Config): string[] {
  const tags = new Set<string>();

  for (const file of readdirSync(config.source.components, { encoding: "utf8", recursive: true })) {
    if (!file.endsWith(".tsx")) {
      continue;
    }
    const path = join(config.source.components, file);
    const source = readFileSync(path, "utf8");
    if (!UNDEFINED_CONTENT_MARKER.test(source)) {
      continue;
    }

    const ast = parse(source, {
      sourceType: "module",
      plugins: PARSE_PLUGINS,
    });

    visitNodes(ast.program, (node) => {
      if (node.type === "ClassDeclaration") {
        const tag = componentTag(node);
        if (tag !== undefined) {
          tags.add(tag);
        }
      }
    });
  }

  return [...tags].sort();
}

/**
 * Suppresses content while its custom element is undefined, but keeps
 * server-rendered hosts visible through Stencil's `hydrated` marker.
 */
function undefinedContentSelector(config: Config): string {
  return `:where(${undefinedContentTags(config).join(", ")}):not(:defined):not(.hydrated)`;
}

export { undefinedContentSelector, undefinedContentTags };

/// <reference types="node" />
import { parseSync, type Comment } from "oxc-parser";

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

/** A `@Component({ tag })` declaration and its documented behavior. */
export interface ComponentDeclaration {
  tag: string;
  undefinedContent: boolean;
}

function isAstNode(value: unknown): value is AstNode {
  return (
    typeof value === "object" && value !== null && typeof Reflect.get(value, "type") === "string"
  );
}

function nodeStart(node: AstNode): number {
  const start: unknown = Reflect.get(node, "start");
  return typeof start === "number" ? start : 0;
}

/**
 * Reads the JSDoc marker attached to the declaration or its enclosing export.
 * Decorators sit between the comment and the class, so the first decorator is
 * the declaration's visual start.
 */
function hasUndefinedContentMarker(context: {
  source: string;
  comments: readonly Comment[];
  node: AstNode;
  parent: AstNode | undefined;
}): boolean {
  let start = nodeStart(context.node);
  const decorators: unknown = Reflect.get(context.node, "decorators");

  if (Array.isArray(decorators)) {
    for (const decorator of decorators) {
      if (isAstNode(decorator)) {
        start = Math.min(start, nodeStart(decorator));
      }
    }
  }

  if (
    context.parent?.type !== "ExportNamedDeclaration" &&
    context.parent?.type !== "ExportDefaultDeclaration"
  ) {
    return false;
  }

  start = Math.min(start, nodeStart(context.parent));

  return context.comments.some(
    (comment) =>
      comment.type === "Block" &&
      comment.end <= start &&
      UNDEFINED_CONTENT_MARKER.test(comment.value) &&
      context.source.slice(comment.end, start).trim() === "",
  );
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
    const options: unknown = Reflect.get(args, 0);
    if (!isAstNode(options) || options.type !== "ObjectExpression") {
      continue;
    }

    const properties: unknown = Reflect.get(options, "properties");
    if (!Array.isArray(properties)) {
      continue;
    }

    for (const property of properties) {
      if (!isAstNode(property) || property.type !== "Property") {
        continue;
      }
      const key: unknown = Reflect.get(property, "key");
      if (!isAstNode(key) || Reflect.get(key, "name") !== "tag") {
        continue;
      }
      const value: unknown = Reflect.get(property, "value");
      if (!isAstNode(value) || value.type !== "Literal") {
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

function visitNodes(
  value: unknown,
  parent: AstNode | undefined,
  visit: (node: AstNode, parent: AstNode | undefined) => void,
): void {
  if (Array.isArray(value)) {
    for (const item of value) {
      visitNodes(item, parent, visit);
    }
    return;
  }
  if (!isAstNode(value)) {
    return;
  }

  visit(value, parent);
  for (const [key, child] of Object.entries(value)) {
    if (key !== "type" && !SKIPPED_AST_KEYS.has(key)) {
      visitNodes(child, value, visit);
    }
  }
}

/**
 * Parses a component source file into its `@Component` declarations.
 *
 * The `@undefinedContent` marker is scoped to the declaration that owns the
 * JSDoc comment, so a file with several components only hides the marked one.
 */
export function componentDeclarationsFromSource(
  source: string,
  filename = "component.tsx",
): ComponentDeclaration[] {
  if (!source.includes("@Component")) {
    return [];
  }

  const result = parseSync(filename, source, {
    lang: "tsx",
    sourceType: "module",
  });
  if (result.errors.length > 0) {
    const [error] = result.errors;
    throw new Error(
      `[qui] failed to parse ${filename}: ${error?.message ?? "unknown parser error"}`,
    );
  }

  const declarations: ComponentDeclaration[] = [];

  visitNodes(result.program, undefined, (node, parent) => {
    if (node.type !== "ClassDeclaration") {
      return;
    }
    const tag = componentTag(node);
    if (tag !== undefined) {
      declarations.push({
        tag,
        undefinedContent: hasUndefinedContentMarker({
          source,
          comments: result.comments,
          node,
          parent,
        }),
      });
    }
  });

  return declarations;
}

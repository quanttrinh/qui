/// <reference types="node" />
import { parse, type ParserPlugin } from "@babel/parser";

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

function commentsOf(node: AstNode | undefined): unknown[] {
  if (node === undefined) {
    return [];
  }
  const comments: unknown = Reflect.get(node, "leadingComments");
  return Array.isArray(comments) ? comments : [];
}

/**
 * Reads the JSDoc marker from the class or its enclosing export declaration.
 * Babel attaches documentation for `export class` to the export, not the class.
 */
function hasUndefinedContentMarker(node: AstNode, parent: AstNode | undefined): boolean {
  return [...commentsOf(node), ...commentsOf(parent)].some((comment) => {
    if (!isAstNode(comment) || comment.type !== "CommentBlock") {
      return false;
    }
    const value: unknown = Reflect.get(comment, "value");
    return typeof value === "string" && UNDEFINED_CONTENT_MARKER.test(value);
  });
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
export function componentDeclarationsFromSource(source: string): ComponentDeclaration[] {
  if (!source.includes("@Component")) {
    return [];
  }

  const ast = parse(source, {
    sourceType: "module",
    plugins: PARSE_PLUGINS,
  });
  const declarations: ComponentDeclaration[] = [];

  visitNodes(ast.program, undefined, (node, parent) => {
    if (node.type !== "ClassDeclaration") {
      return;
    }
    const tag = componentTag(node);
    if (tag !== undefined) {
      declarations.push({ tag, undefinedContent: hasUndefinedContentMarker(node, parent) });
    }
  });

  return declarations;
}

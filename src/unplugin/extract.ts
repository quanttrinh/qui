import { parseSync, visitorKeys, type Node } from "oxc-parser";
import { parseFragment, type DefaultTreeAdapterTypes } from "parse5";
import { extname } from "pathe";

const TYPESCRIPT_EXTENSIONS = new Set([".cts", ".mts", ".ts"]);
const INCOMPLETE_COMPONENT_TAG = /<(?<tag>qui-[a-z0-9]+(?:-[a-z0-9]+)*)(?=[\s/>]|$)/gu;
const COMPONENT_CALLS = new Set(["h", "jsx", "jsxs", "createElement"]);

function isNode(value: unknown): value is Node {
  return (
    typeof value === "object" && value !== null && typeof Reflect.get(value, "type") === "string"
  );
}

function pushChildNodes(node: Node, stack: Node[]): void {
  for (const key of visitorKeys[node.type] ?? []) {
    const value: unknown = Reflect.get(node, key);
    if (Array.isArray(value)) {
      for (const child of value as unknown[]) {
        if (isNode(child)) {
          stack.push(child);
        }
      }
    } else if (isNode(value)) {
      stack.push(value);
    }
  }
}

function walk(node: Node, visit: (node: Node) => void): void {
  const stack: Node[] = [node];
  while (stack.length > 0) {
    const current = stack.pop();
    if (current !== undefined) {
      visit(current);
      pushChildNodes(current, stack);
    }
  }
}

function tagName(value: unknown): string | undefined {
  if (!isNode(value)) {
    return undefined;
  }
  if (value.type === "Literal" && typeof value.value === "string") {
    return value.value;
  }
  if (value.type === "TemplateLiteral" && value.expressions.length === 0) {
    return value.quasis[0]?.value.cooked ?? undefined;
  }
  return undefined;
}

function isComponentCall(node: Node): boolean {
  if (node.type === "Identifier") {
    return COMPONENT_CALLS.has(node.name);
  }
  if (node.type === "MemberExpression" && !node.computed && node.property.type === "Identifier") {
    return COMPONENT_CALLS.has(node.property.name);
  }
  return false;
}

function addTag(tag: string | undefined, components: Set<string>): void {
  if (tag?.startsWith("qui-") === true) {
    components.add(tag);
  }
}

function collect(node: Node, components: Set<string>): void {
  if (node.type === "JSXOpeningElement") {
    if (node.name.type === "JSXIdentifier") {
      addTag(node.name.name, components);
    }
    return;
  }
  if (node.type === "CallExpression" && isComponentCall(node.callee)) {
    addTag(tagName(node.arguments[0]), components);
  }
}

function languageFor(filename: string): "js" | "jsx" | "ts" | "tsx" {
  const extension = extname(filename);
  if (extension === ".tsx") {
    return "tsx";
  }
  if (TYPESCRIPT_EXTENSIONS.has(extension)) {
    return "ts";
  }
  if (extension === ".jsx") {
    return "jsx";
  }
  return "js";
}

export function extractComponentsFromJavaScript(
  code: string,
  filename: string,
): string[] | undefined {
  const result = parseSync(filename, code, {
    lang: languageFor(filename),
    sourceType: "unambiguous",
  });
  if (result.errors.length > 0) {
    return undefined;
  }

  const components = new Set<string>();
  walk(result.program, (node) => {
    collect(node, components);
  });
  return [...components].sort();
}

function collectMarkupComponents(
  node: DefaultTreeAdapterTypes.Node,
  components: Set<string>,
): void {
  if ("tagName" in node && node.tagName.startsWith("qui-")) {
    components.add(node.tagName);
  }
  if ("childNodes" in node) {
    for (const child of node.childNodes) {
      collectMarkupComponents(child, components);
    }
  }
  if ("content" in node) {
    collectMarkupComponents(node.content, components);
  }
}

export function extractComponentsFromText(code: string): string[] {
  const components = new Set<string>();
  collectMarkupComponents(parseFragment(code), components);
  // Parse5 drops an unterminated tag at EOF. Keep a lexical fallback for
  // Malformed MDX/JSX while the parser recovers on the next edit.
  for (const match of code.matchAll(INCOMPLETE_COMPONENT_TAG)) {
    const tag = match.groups?.tag;
    if (tag !== undefined) {
      components.add(tag);
    }
  }
  return [...components].sort();
}

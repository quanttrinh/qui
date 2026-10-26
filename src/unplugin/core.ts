import { extractComponentsFromJavaScript, extractComponentsFromText } from "./extract";

export interface QuiPluginOptions {
  /**
   * Emit the shared CSS and configure the stylesheet URL used by shadow roots.
   * Defaults to `true`.
   */
  styles?: boolean;
}

const COMPONENT_TAG_NAME = /^qui-[a-z0-9]+(?:-[a-z0-9]+)*$/u;
const JAVASCRIPT_FILE = /\.(?:[cm]?[jt]sx?)$/u;
const TRANSFORMABLE_FILE = /\.(?:[cm]?[jt]sx?|mdx)$/u;
const ESCAPED_CHARACTER = /\\[ux]/u;

export const VIRTUAL_MODULE_ID = "virtual:qui/register";
export const VIRTUAL_STYLES_ID = "virtual:qui/styles";

export function mayContainComponents(code: string): boolean {
  return code.includes("qui-") || ESCAPED_CHARACTER.test(code);
}

export function normalizeComponents(components: Iterable<string>): string[] {
  const normalized = new Set<string>();
  for (const component of components) {
    if (COMPONENT_TAG_NAME.test(component)) {
      normalized.add(component);
    }
  }
  return [...normalized].sort();
}

/**
 * Finds opening component tags in JavaScript-family source using Oxc's AST,
 * with a lexical fallback for MDX and files the parser rejects.
 */
export function extractComponents(code: string, id = "component.tsx"): string[] {
  // Every detectable tag either contains this prefix or an escaped character.
  // Oxc resolves escaped characters in static tag names.
  if (!mayContainComponents(code)) {
    return [];
  }
  const file = (id.split("?")[0] ?? id).replaceAll("\\", "/");
  const components = JAVASCRIPT_FILE.test(file)
    ? (extractComponentsFromJavaScript(code, file) ?? extractComponentsFromText(code))
    : extractComponentsFromText(code);
  return normalizeComponents(components);
}

export function virtualModuleId(components: Iterable<string>): string {
  const tags = normalizeComponents(components);
  return `${VIRTUAL_MODULE_ID}?components=${tags.map((tag) => encodeURIComponent(tag)).join(",")}`;
}

export function componentsFromVirtualModuleId(id: string): string[] | undefined {
  if (!id.startsWith(`${VIRTUAL_MODULE_ID}?`)) {
    return undefined;
  }
  const query = id.slice(id.indexOf("?") + 1);
  const value = new URLSearchParams(query).get("components");
  return value === null ? [] : normalizeComponents(value.split(","));
}

export function isTransformableId(id: string): boolean {
  if (id.startsWith("\0") || id.startsWith("virtual:")) {
    return false;
  }
  const file = (id.split("?")[0] ?? id).replaceAll("\\", "/");
  if (file.startsWith("node_modules/") || file.includes("/node_modules/")) {
    return false;
  }
  return TRANSFORMABLE_FILE.test(file);
}

/**
 * Returns the offset after leading frontmatter, or zero when there is none.
 * MDX requires imports to follow frontmatter rather than precede it.
 */
export function importInjectionOffset(code: string): number {
  if (!code.startsWith("---")) {
    return 0;
  }
  const match = /^---[^\S\r\n]*(?:\r?\n)(?:[\s\S]*?\r?\n)?---[^\S\r\n]*(?:\r?\n|$)/u.exec(code);
  return match?.[0].length ?? 0;
}

/**
 * Creates the shared stylesheet module.
 *
 * The CSS is embedded in the module so the same URL works across bundlers.
 * A document that already provides a marked stylesheet keeps that sheet; only
 * plugin-managed apps get a blob URL for both the document and shadow roots.
 */
export function createStylesModule(css: string): string {
  return [
    'import "@quanttrinh/qui/theme.css";',
    'import { getQuiStylesHref, resetQuiStylesHref, setQuiStylesHref } from "@quanttrinh/qui/runtime";',
    "",
    `const stylesheet = ${JSON.stringify(css)};`,
    'if (typeof document !== "undefined" && getQuiStylesHref() === undefined) {',
    '  const url = URL.createObjectURL(new Blob([stylesheet], { type: "text/css" }));',
    '  const link = document.createElement("link");',
    '  link.rel = "stylesheet";',
    "  link.href = url;",
    '  link.setAttribute("data-qui-styles", "");',
    "  document.head.append(link);",
    "  setQuiStylesHref(url);",
    "  import.meta.hot?.dispose(() => {",
    "    link.remove();",
    "    URL.revokeObjectURL(url);",
    "    resetQuiStylesHref();",
    "  });",
    "}",
    "",
  ].join("\n");
}

/**
 * Creates a static module that defines the discovered components.
 *
 * Tags are sorted for deterministic output. Context parts retry when their
 * provider upgrades, so providers do not need a separate registration order.
 */
export function createRegistrationModule(
  components: Iterable<string>,
  options: QuiPluginOptions = {},
): string {
  const tags = normalizeComponents(components);
  if (tags.length === 0) {
    return "";
  }

  const bindings: string[] = [];
  const definitions: string[] = [];
  for (const [index, tag] of tags.entries()) {
    const binding = `__qui_${index}`;
    bindings.push(binding);
    definitions.push(
      `import { defineCustomElement as ${binding} } from "@quanttrinh/qui/shared/${tag}";`,
    );
  }

  return [
    ...(options.styles === false ? [] : [`import "${VIRTUAL_STYLES_ID}";`]),
    'import { defineComponents } from "@quanttrinh/qui/register";',
    ...definitions,
    `defineComponents(${bindings.join(", ")});`,
    "",
  ].join("\n");
}

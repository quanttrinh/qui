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

// Keep provider tags in sync with ContextPartKey in src/components/shared/context-part.ts.
/**
 * Provider tags must be defined before the parts that consume them. Only
 * providers need an entry here; all other tags inherit the default priority.
 */
const COMPONENT_PRIORITY: Readonly<Record<string, number>> = {
  "qui-field": 0,
  "qui-accordion": 0,
  "qui-tabs": 0,
  "qui-dialog": 0,
  "qui-accordion-item": 1,
  "qui-radio-group": 1,
};

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
 * Sorts tags so providers are defined before the parts that consume them.
 * Falls back to alphabetical order for unrelated components.
 */
export function registrationOrder(components: Iterable<string>): string[] {
  return normalizeComponents(components).sort((left, right) => {
    const priority = (COMPONENT_PRIORITY[left] ?? 100) - (COMPONENT_PRIORITY[right] ?? 100);
    if (priority !== 0) {
      return priority;
    }
    if (left === right) {
      return 0;
    }
    return left < right ? -1 : 1;
  });
}

/**
 * Finds opening component tags in JavaScript-family source using Oxc's AST,
 * with a lexical fallback for Astro, MDX, and files the parser rejects.
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
  const match = /^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/u.exec(code);
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
    'import { getQuiStylesHref, setQuiStylesHref } from "@quanttrinh/qui/runtime";',
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
    "  import.meta.hot?.dispose(() => URL.revokeObjectURL(url));",
    "}",
    "",
  ].join("\n");
}

export function createRegistrationModule(
  components: Iterable<string>,
  options: QuiPluginOptions = {},
): string {
  const tags = registrationOrder(components);
  if (tags.length === 0) {
    return "";
  }

  const bindings: string[] = [];
  const lines = [
    ...(options.styles === false ? [] : [`import "${VIRTUAL_STYLES_ID}";`]),
    'import { defineComponents } from "@quanttrinh/qui/register";',
  ];

  for (const [index, tag] of tags.entries()) {
    const binding = `__qui_${index}`;
    bindings.push(binding);
    lines.push(
      `import { defineCustomElement as ${binding} } from "@quanttrinh/qui/shared/${tag}";`,
    );
  }

  lines.push(`defineComponents(${bindings.join(", ")});`);

  return `${lines.join("\n")}\n`;
}

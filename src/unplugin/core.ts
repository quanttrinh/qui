import { parse, type DefaultTreeAdapterTypes } from "parse5";
import { extname, normalize } from "pathe";

import { extractComponentsFromJavaScript, extractComponentsFromText } from "./extract";

export interface QuiStylesOptions {
  /**
   * Stable public URL of the component/app stylesheet. Vite marks a matching
   * document `<link>` during the build. This must not point at `theme.css`; the
   * theme is document-only.
   */
  href?: string | string[];
  /**
   * Import `@quanttrinh/qui/theme.css` from the generated styles module.
   * Defaults to `true` for inline styles and `false` for an external `href`.
   */
  theme?: boolean;
}

export interface QuiPluginOptions {
  /**
   * Emit the shared CSS and configure the stylesheet URL used by shadow roots.
   *
   * - `true` embeds the library component stylesheet in the module.
   * - `{ href }` uses an existing external component/app stylesheet instead.
   * - `{ theme: boolean }` controls the document-only theme import.
   * - `false` leaves all styling to the consumer.
   *
   * Defaults to `true`.
   */
  styles?: boolean | QuiStylesOptions;
}

const COMPONENT_TAG_NAME = /^qui-[a-z0-9]+(?:-[a-z0-9]+)*$/u;
const JAVASCRIPT_EXTENSIONS = new Set([
  ".cjs",
  ".cts",
  ".js",
  ".jsx",
  ".mjs",
  ".mts",
  ".ts",
  ".tsx",
]);
const TRANSFORMABLE_EXTENSIONS = new Set([...JAVASCRIPT_EXTENSIONS, ".mdx"]);
const MDX_FRONTMATTER = /^---[^\S\r\n]*(?:\r?\n)(?:[\s\S]*?\r?\n)?---[^\S\r\n]*(?:\r?\n|$)/u;
const STYLESHEET_ATTRIBUTE = "data-qui-styles";
const REL_TOKEN_SPLIT = /\s+/u;

function fileFromId(id: string): string {
  return normalize(id.split("?")[0] ?? id);
}

export const VIRTUAL_MODULE_ID = "virtual:qui/register";
export const VIRTUAL_STYLES_ID = "virtual:qui/styles";

export function mayContainComponents(code: string): boolean {
  return code.includes("qui-") || code.includes(String.raw`\u`) || code.includes(String.raw`\x`);
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
  const file = fileFromId(id);
  const components = JAVASCRIPT_EXTENSIONS.has(extname(file))
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
  const file = fileFromId(id);
  if (file.startsWith("node_modules/") || file.includes("/node_modules/")) {
    return false;
  }
  return TRANSFORMABLE_EXTENSIONS.has(extname(file));
}

/**
 * Returns the offset after leading frontmatter, or zero when there is none.
 * MDX requires imports to follow frontmatter rather than precede it.
 */
export function importInjectionOffset(code: string): number {
  if (!code.startsWith("---")) {
    return 0;
  }
  const match = MDX_FRONTMATTER.exec(code);
  return match?.[0].length ?? 0;
}

/** Returns whether the option selects an existing external component sheet. */
export function isExternalStyles(
  styles: boolean | QuiStylesOptions | undefined,
): styles is QuiStylesOptions & { href: string | string[] } {
  const value: unknown = styles;
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const href: unknown = Reflect.get(value, "href");
  return (
    typeof href === "string" ||
    (Array.isArray(href) && href.every((entry: unknown) => typeof entry === "string"))
  );
}

function stylesheetHrefs(href: string | string[]): string[] {
  const values = Array.isArray(href) ? href : [href];
  return [...new Set(values.filter((value) => value.length > 0))];
}

function themeImport(styles: boolean | QuiStylesOptions | undefined): string[] {
  if (styles === false) {
    return [];
  }
  const value: unknown = styles;
  const theme: unknown =
    typeof value === "object" && value !== null ? Reflect.get(value, "theme") : undefined;
  if (theme === false) {
    return [];
  }
  // Keep external sheets authoritative: theme values often live next to the app.
  // Do not import a second copy when the external sheet already owns them.
  if (isExternalStyles(styles)) {
    return theme === true ? ['import "@quanttrinh/qui/theme.css";'] : [];
  }
  return ['import "@quanttrinh/qui/theme.css";'];
}

/**
 * Creates the shared stylesheet module for the embedded (blob URL) strategy.
 *
 * Only the component stylesheet is adopted by shadow roots. The theme, when
 * imported, remains a document-level stylesheet.
 */
export function createStylesModule(css: string, styles: boolean | QuiStylesOptions = true): string {
  return [
    ...themeImport(styles),
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
 * Creates the external stylesheet module.
 *
 * External mode relies on marked document links emitted by the bundler or SSR.
 * The runtime discovers them when components connect, including Vite's base and
 * hashed URL. No client-side fallback is stored, so the module does not create
 * or rewrite markup and HMR needs no cleanup.
 */
export function createExternalStylesModule(styles: QuiStylesOptions): string {
  return [...themeImport(styles), ""].join("\n");
}

function isPrimaryStylesheet(rel: string): boolean {
  const tokens = rel.toLowerCase().split(REL_TOKEN_SPLIT);
  return tokens.includes("stylesheet") && !tokens.includes("alternate");
}

function isElementNode(
  node: DefaultTreeAdapterTypes.Node,
): node is DefaultTreeAdapterTypes.Element {
  return "tagName" in node;
}

function attributeValue(
  element: DefaultTreeAdapterTypes.Element,
  name: string,
): string | undefined {
  return element.attrs.find((attribute) => attribute.name === name)?.value;
}

/**
 * Adds `data-qui-styles` to stylesheet links that point at a configured
 * external component/app stylesheet. Vite calls this through
 * `transformIndexHtml` during dev and build, so the marker is present in the
 * emitted HTML without client-side rewriting.
 *
 * parse5 supplies source offsets, so the marker is inserted into the original
 * markup instead of reserializing the document. Links inside scripts, comments,
 * textareas, and template content are not elements in the main tree and are
 * therefore left untouched.
 */
export function markStylesheetLinks(html: string, href: string | string[]): string {
  const hrefs = new Set(stylesheetHrefs(href));
  if (hrefs.size === 0) {
    return html;
  }

  const document = parse(html, { sourceCodeLocationInfo: true });
  const offsets: number[] = [];

  const visit = (node: DefaultTreeAdapterTypes.Node): void => {
    if (
      isElementNode(node) &&
      node.tagName === "link" &&
      attributeValue(node, STYLESHEET_ATTRIBUTE) === undefined
    ) {
      const hrefValue = attributeValue(node, "href");
      const relValue = attributeValue(node, "rel");
      const startTag = node.sourceCodeLocation?.startTag;
      if (
        hrefValue !== undefined &&
        hrefs.has(hrefValue) &&
        relValue !== undefined &&
        isPrimaryStylesheet(relValue) &&
        startTag !== undefined
      ) {
        const selfClosing = html.slice(startTag.endOffset - 2, startTag.endOffset) === "/>";
        offsets.push(startTag.endOffset - (selfClosing ? 2 : 1));
      }
    }

    if ("childNodes" in node) {
      for (const child of node.childNodes) {
        visit(child);
      }
    }
  };

  visit(document);

  let result = html;
  for (const offset of offsets.sort((left, right) => right - left)) {
    result = `${result.slice(0, offset)} data-qui-styles${result.slice(offset)}`;
  }
  return result;
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

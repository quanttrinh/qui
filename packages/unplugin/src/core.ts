import matter from "gray-matter";
import { parse, type DefaultTreeAdapterTypes } from "parse5";
import { extname, normalize } from "pathe";

import { extractComponentsFromJavaScript, extractComponentsFromText } from "./extract";

/** A concrete stylesheet URL or an ordered list of URLs. */
export type QuiStylesHref = string | string[];

/** Minimal shape of a bundler asset needed to discover hashed CSS output. */
export interface QuiStylesBundleAsset {
  type: string;
  fileName: string;
  name?: string;
  names?: string[];
  originalFileNames?: string[];
}

/**
 * Context passed to a stylesheet resolver.
 *
 * `bundle` is available for production builds, where it lets a resolver select
 * the emitted (possibly content-hashed) CSS asset. `server` is available while
 * serving, for resolvers that need the Vite dev server.
 */
export interface QuiStylesResolverContext {
  command: "serve" | "build";
  mode: string;
  base: string;
  isSsrBuild: boolean;
  /** Path of the HTML document being processed, when known. */
  path?: string;
  /** Absolute filename of the HTML document being processed, when known. */
  filename?: string;
  bundle?: Readonly<Record<string, QuiStylesBundleAsset>>;
  server?: unknown;
}

/**
 * Resolves the external stylesheet URL.
 *
 * Use a resolver when the final URL is not known when the plugin is configured,
 * for example when Vite adds a content hash to the emitted asset.
 */
export type QuiStylesHrefResolver = (
  context: QuiStylesResolverContext,
) => QuiStylesHref | undefined | Promise<QuiStylesHref | undefined>;

export type QuiStylesHrefValue = QuiStylesHref | QuiStylesHrefResolver;

/** Returns whether a value is a supported configured stylesheet href. */
export function isStylesHrefValue(value: unknown): value is QuiStylesHrefValue {
  return (
    typeof value === "string" ||
    typeof value === "function" ||
    (Array.isArray(value) && value.every((entry: unknown) => typeof entry === "string"))
  );
}

export interface QuiStylesOptions {
  /**
   * Public URL of the component/app stylesheet, or a resolver that returns it.
   * Vite marks a matching document `<link>` during the build, including a
   * hashed URL returned by the resolver. This must not point at `theme.css`;
   * the theme is document-only.
   */
  href?: QuiStylesHrefValue;
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
// Keep in sync with STYLESHEET_ATTRIBUTE exported by @quanttrinh/qui/runtime.
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
function skipClosingFenceWhitespace(code: string, offset: number): number {
  let cursor = offset;
  while (code[cursor] === " " || code[cursor] === "\t") {
    cursor += 1;
  }
  if (code.startsWith("\r\n", cursor)) {
    return cursor + 2;
  }
  if (code[cursor] === "\n") {
    return cursor + 1;
  }
  return cursor === code.length ? cursor : offset;
}

export function importInjectionOffset(code: string): number {
  if (!code.startsWith("---")) {
    return 0;
  }
  try {
    const { content } = matter(code);
    return skipClosingFenceWhitespace(code, code.length - content.length);
  } catch {
    // Invalid frontmatter fails the MDX build; do not inject before it.
    return 0;
  }
}

/** Returns whether the option selects an existing external component sheet. */
export function isExternalStyles(
  styles: boolean | QuiStylesOptions | undefined,
): styles is QuiStylesOptions & { href: QuiStylesHrefValue } {
  const value: unknown = styles;
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const href: unknown = Reflect.get(value, "href");
  return isStylesHrefValue(href);
}

function uniqueHrefs(values: Iterable<string>): string[] {
  const hrefs: string[] = [];
  for (const value of values) {
    if (value.length > 0 && !hrefs.includes(value)) {
      hrefs.push(value);
    }
  }
  return hrefs;
}

function stylesheetHrefs(href: QuiStylesHref): string[] {
  const values = Array.isArray(href) ? href : [href];
  return uniqueHrefs(values);
}

/**
 * Applies Vite's public base the way Vite does: unconditionally to
 * root-relative URLs, leaving absolute and protocol-relative URLs alone.
 */
function withBase(hrefs: string[], base: string): string[] {
  if (base === "" || base === "/" || base.startsWith("./")) {
    return hrefs;
  }
  const normalizedBase = base.endsWith("/") ? base : `${base}/`;
  return hrefs.map((href) => {
    if (!href.startsWith("/") || href.startsWith("//")) {
      return href;
    }
    return `${normalizedBase}${href.slice(1)}`;
  });
}

async function resolveRawStylesheetHrefs(
  href: QuiStylesHrefValue | undefined,
  context: QuiStylesResolverContext,
): Promise<string[]> {
  if (href === undefined) {
    return [];
  }
  const resolved = typeof href === "function" ? await href(context) : href;
  if (resolved === undefined) {
    return [];
  }
  return stylesheetHrefs(resolved);
}

/**
 * Resolves configured stylesheet URLs, calling a resolver with the current
 * bundler context when one is configured. The returned URLs include the Vite
 * base, so callers can use them directly in SSR documents and shadow roots.
 * Empty and duplicate values are removed after base application.
 */
export async function resolveStylesheetHrefs(
  href: QuiStylesHrefValue | undefined,
  context: QuiStylesResolverContext,
): Promise<string[]> {
  const hrefs = await resolveRawStylesheetHrefs(href, context);
  return uniqueHrefs(withBase(hrefs, context.base));
}

/**
 * Returns both the raw and base-applied URLs. HTML marking uses these
 * candidates because Vite may already have prefixed a configured URL that
 * includes the base segment.
 */
export async function resolveStylesheetHrefCandidates(
  href: QuiStylesHrefValue | undefined,
  context: QuiStylesResolverContext,
): Promise<string[]> {
  const hrefs = await resolveRawStylesheetHrefs(href, context);
  return uniqueHrefs([...hrefs, ...withBase(hrefs, context.base)]);
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
    `  link.setAttribute(${JSON.stringify(STYLESHEET_ATTRIBUTE)}, "");`,
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
    result = `${result.slice(0, offset)} ${STYLESHEET_ATTRIBUTE}${result.slice(offset)}`;
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

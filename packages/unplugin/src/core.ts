import {
  componentRegistrationModule,
  isPrimaryStylesheetRel,
  isStylesHrefValue,
  normalizeComponentTags,
  STYLESHEET_ATTRIBUTE,
  stylesheetLinkHtml,
  uniqueHrefs,
  type QuiStylesHrefValue,
} from "@quanttrinh/qui/internal";
import matter from "gray-matter";
import { parse, type DefaultTreeAdapterTypes } from "parse5";
import { extname, normalize } from "pathe";

import { extractComponentsFromJavaScript, extractComponentsFromText } from "./extract";

export {
  isStylesHrefValue,
  resolveStylesheetHrefCandidates,
  resolveStylesheetHrefs,
} from "@quanttrinh/qui/internal";
export type {
  QuiStylesBundleAsset,
  QuiStylesHref,
  QuiStylesHrefResolver,
  QuiStylesHrefValue,
  QuiStylesResolverContext,
} from "@quanttrinh/qui/internal";

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

export interface QuiRegistrationOptions {
  /**
   * Path to a JSON manifest of components discovered from rendered SSR/SSG
   * HTML. Relative paths are resolved from the Vite root.
   */
  manifest?: string;
  /** Additional component tags to register alongside the manifest. */
  components?: string[];
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
  /**
   * Register components discovered from rendered output. Import
   * `virtual:qui/registration-manifest` from the client entry to merge these
   * tags with the source-scanned registrations.
   */
  registration?: QuiRegistrationOptions;
}

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

function fileFromId(id: string): string {
  return normalize(id.split("?")[0] ?? id);
}

export const VIRTUAL_MODULE_ID = "virtual:qui/register";
export const VIRTUAL_STYLES_ID = "virtual:qui/styles";
export const VIRTUAL_REGISTRATION_MANIFEST_ID = "virtual:qui/registration-manifest";

export function mayContainComponents(code: string): boolean {
  return code.includes("qui-") || code.includes(String.raw`\u`) || code.includes(String.raw`\x`);
}

export function normalizeComponents(components: Iterable<string>): string[] {
  return normalizeComponentTags(components);
}

/**
 * Components that compose other custom elements internally rather than
 * declaring them directly in consumer source.
 */
const COMPONENT_DEPENDENCIES: Readonly<Record<string, readonly string[]>> = {
  "qui-combobox": ["qui-popover"],
  "qui-select": ["qui-popover"],
};

/** Expand component tags with their internal custom-element dependencies. */
export function expandComponents(components: Iterable<string>): string[] {
  const tags = new Set(normalizeComponents(components));
  const pending = [...tags];

  while (pending.length > 0) {
    const tag = pending.pop();

    if (tag !== undefined) {
      for (const dependency of COMPONENT_DEPENDENCIES[tag] ?? []) {
        if (!tags.has(dependency)) {
          tags.add(dependency);
          pending.push(dependency);
        }
      }
    }
  }

  return normalizeComponents(tags);
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
  const tags = expandComponents(components);
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
  const hrefs = new Set(uniqueHrefs(href));
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
        isPrimaryStylesheetRel(relValue) &&
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
  for (const offset of offsets.toSorted((left, right) => right - left)) {
    result = `${result.slice(0, offset)} ${STYLESHEET_ATTRIBUTE}${result.slice(offset)}`;
  }
  return result;
}

export interface EnsureStylesheetLinksOptions {
  /** CSP nonce applied to stylesheet links created by the helper. */
  nonce?: string;
}

function markerOffsetForLink(
  node: DefaultTreeAdapterTypes.Element,
  html: string,
): number | undefined {
  const startTag = node.sourceCodeLocation?.startTag;
  if (startTag === undefined) {
    return undefined;
  }
  const selfClosing = html.slice(startTag.endOffset - 2, startTag.endOffset) === "/>";
  return startTag.endOffset - (selfClosing ? 2 : 1);
}

interface StylesheetScan {
  html: string;
  hrefSet: Set<string>;
  present: Set<string>;
  markerOffsets: number[];
  removals: { start: number; end: number }[];
}

function collectStylesheetLink(node: DefaultTreeAdapterTypes.Element, scan: StylesheetScan): void {
  if (node.tagName !== "link") {
    return;
  }
  const hrefValue = attributeValue(node, "href");
  const marked = attributeValue(node, STYLESHEET_ATTRIBUTE) !== undefined;
  const startTag = node.sourceCodeLocation?.startTag;

  // Managed links that no longer point at a configured href are stale.
  if (marked && (hrefValue === undefined || !scan.hrefSet.has(hrefValue))) {
    if (startTag !== undefined) {
      scan.removals.push({ start: startTag.startOffset, end: startTag.endOffset });
    }
    return;
  }

  if (
    hrefValue === undefined ||
    !scan.hrefSet.has(hrefValue) ||
    !isPrimaryStylesheetRel(attributeValue(node, "rel"))
  ) {
    return;
  }

  scan.present.add(hrefValue);
  if (marked) {
    return;
  }
  const offset = markerOffsetForLink(node, scan.html);
  if (offset !== undefined) {
    scan.markerOffsets.push(offset);
  }
}

interface Edit {
  start: number;
  end: number;
  text: string;
}

function applyEdits(html: string, edits: Edit[]): string {
  let result = html;
  for (const edit of edits.toSorted(
    (left, right) => right.start - left.start || right.end - left.end,
  )) {
    result = `${result.slice(0, edit.start)}${edit.text}${result.slice(edit.end)}`;
  }
  return result;
}

function lastChildEnd(node: DefaultTreeAdapterTypes.Element): number | undefined {
  for (let index = node.childNodes.length - 1; index >= 0; index -= 1) {
    const end = node.childNodes[index]?.sourceCodeLocation?.endOffset;
    if (end !== undefined) {
      return end;
    }
  }
  return undefined;
}

/**
 * Ensures every configured href has a marked document stylesheet link. Existing
 * matching links are marked in place, managed links that point elsewhere are
 * removed, and missing links are inserted before `</head>` (or the end of the
 * last head child when the end tag is implied).
 */
export function ensureStylesheetLinks(
  html: string,
  href: string | string[],
  options: EnsureStylesheetLinksOptions = {},
): string {
  const hrefs = uniqueHrefs(href);
  if (hrefs.length === 0) {
    return html;
  }

  const scan: StylesheetScan = {
    html,
    hrefSet: new Set(hrefs),
    present: new Set(),
    markerOffsets: [],
    removals: [],
  };
  const document = parse(html, { sourceCodeLocationInfo: true });
  let headEndOffset: number | undefined;

  const visit = (node: DefaultTreeAdapterTypes.Node): void => {
    if (isElementNode(node)) {
      if (node.tagName === "head") {
        const endTag = node.sourceCodeLocation?.endTag;
        const startTag = node.sourceCodeLocation?.startTag;
        headEndOffset =
          endTag?.startOffset ??
          (startTag === undefined ? undefined : (lastChildEnd(node) ?? startTag.endOffset));
      }
      collectStylesheetLink(node, scan);
    }

    if ("childNodes" in node) {
      for (const child of node.childNodes) {
        visit(child);
      }
    }
  };

  visit(document);

  const missing = hrefs.filter((value) => !scan.present.has(value));
  const edits: Edit[] = [
    ...scan.markerOffsets.map((offset) => ({
      start: offset,
      end: offset,
      text: ` ${STYLESHEET_ATTRIBUTE}`,
    })),
    ...scan.removals.map((range) => ({ start: range.start, end: range.end, text: "" })),
  ];
  if (missing.length > 0 && headEndOffset !== undefined) {
    edits.push({
      start: headEndOffset,
      end: headEndOffset,
      text: stylesheetLinkHtml(missing, { nonce: options.nonce }),
    });
  }
  return applyEdits(html, edits);
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
  return componentRegistrationModule(expandComponents(components), {
    stylesImport: options.styles === false ? undefined : VIRTUAL_STYLES_ID,
  });
}

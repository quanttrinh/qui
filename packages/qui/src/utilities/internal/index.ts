/**
 * Internal helpers shared by the runtime, SSR helper, and build plugins.
 * This entry point is not part of the public API and may change between
 * releases.
 */

/** Attribute that marks a document or shadow-root stylesheet managed by qui. */
export const STYLESHEET_ATTRIBUTE = "data-qui-styles";
/** Selector for stylesheet links managed by qui. */
export const STYLESHEET_SELECTOR = `link[${STYLESHEET_ATTRIBUTE}]`;
/** Set by components that call `ensureShadowStylesheet`. */
export const SHADOW_STYLES_MARKER = "data-qui-shadow-styles";
/** Selector for hosts that opted into shadow-root stylesheet management. */
export const SHADOW_STYLES_HOST_SELECTOR = `[${SHADOW_STYLES_MARKER}]`;

const REL_TOKEN_SPLIT = /\s+/u;

/** Removes empty and duplicate stylesheet hrefs while preserving order. */
export function uniqueHrefs(href: string | string[]): string[] {
  const values = Array.isArray(href) ? href : [href];
  const hrefs: string[] = [];

  for (const value of values) {
    if (value.length > 0 && !hrefs.includes(value)) {
      hrefs.push(value);
    }
  }

  return hrefs;
}

/** Returns whether a `rel` token list identifies a primary stylesheet. */
export function isPrimaryStylesheetRel(rel: string | null | undefined): boolean {
  if (rel === null || rel === undefined) {
    return false;
  }
  const tokens = rel.toLowerCase().split(REL_TOKEN_SPLIT);
  return tokens.includes("stylesheet") && !tokens.includes("alternate");
}

const COMPONENT_TAG_NAME = /^qui-[a-z0-9]+(?:-[a-z0-9]+)*$/u;

/** Normalizes and sorts valid qui component tags. */
export function normalizeComponentTags(components: Iterable<string>): string[] {
  const normalized = new Set<string>();
  for (const component of components) {
    if (COMPONENT_TAG_NAME.test(component)) {
      normalized.add(component);
    }
  }
  return [...normalized].toSorted();
}

export interface ComponentRegistrationOptions {
  /** Module imported before the component definitions, such as a styles entry. */
  stylesImport?: string;
}

/**
 * Creates a static ES module that imports and registers the given components.
 * The module is deterministic so bundlers can cache and tree-shake it.
 */
export function componentRegistrationModule(
  components: Iterable<string>,
  options: ComponentRegistrationOptions = {},
): string {
  const tags = normalizeComponentTags(components);
  if (tags.length === 0) {
    return "";
  }

  const bindings = tags.map((_tag, index) => `__qui_${index}`);
  const lines = [
    ...(options.stylesImport === undefined ? [] : [`import "${options.stylesImport}";`]),
    'import { defineComponents } from "@quanttrinh/qui/register";',
    ...tags.map(
      (tag, index) =>
        `import { defineCustomElement as ${bindings[index]} } from "@quanttrinh/qui/shared/${tag}";`,
    ),
    `defineComponents(${bindings.join(", ")});`,
    "",
  ];

  return lines.join("\n");
}

export interface StylesheetLinkOptions {
  /** CSP nonce applied to the generated links. */
  nonce?: string;
  /** Add the `data-qui-styles` marker. Defaults to true. */
  marker?: boolean;
}

function escapeHtmlAttribute(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

/** Serializes stylesheet `<link>` elements for SSR document shells. */
export function stylesheetLinkHtml(hrefs: string[], options: StylesheetLinkOptions = {}): string {
  const nonce =
    options.nonce === undefined || options.nonce.length === 0
      ? ""
      : ` nonce="${escapeHtmlAttribute(options.nonce)}"`;
  const marker = options.marker === false ? "" : ` ${STYLESHEET_ATTRIBUTE}`;
  return hrefs
    .map((href) => `<link rel="stylesheet" href="${escapeHtmlAttribute(href)}"${nonce}${marker}>`)
    .join("");
}

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
 * Context passed to a stylesheet resolver. The shape is bundler-neutral; Vite
 * and other integrations provide the base and optional build/server context.
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

/** Resolves the stylesheet URL at build or request time. */
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

function stylesheetHrefs(href: QuiStylesHref): string[] {
  return uniqueHrefs(href);
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
 * bundler context when one is configured. The returned URLs include the base,
 * so callers can use them directly in SSR documents and shadow roots. Empty and
 * duplicate values are removed after base application.
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
 * candidates because an integration may already have prefixed the configured
 * URL with the base segment.
 */
export async function resolveStylesheetHrefCandidates(
  href: QuiStylesHrefValue | undefined,
  context: QuiStylesResolverContext,
): Promise<string[]> {
  const hrefs = await resolveRawStylesheetHrefs(href, context);
  return uniqueHrefs([...hrefs, ...withBase(hrefs, context.base)]);
}

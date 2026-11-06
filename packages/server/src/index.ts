import {
  createWindowFromHtml as stencilCreateWindowFromHtml,
  hydrateDocument as stencilHydrateDocument,
  renderToString as stencilRenderToString,
} from "@quanttrinh/qui/hydrate";
import {
  componentRegistrationModule,
  normalizeComponentTags,
  stylesheetLinkHtml,
  uniqueHrefs,
} from "@quanttrinh/qui/internal";
import {
  withShadowStylesheet,
  type HydrateRenderOptions,
  type ShadowStylesheetOptions,
} from "@quanttrinh/qui/ssr";
import { escapeAttribute, escapeText } from "entities";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseFragment, type DefaultTreeAdapterTypes } from "parse5";

export { isStylesHrefValue, resolveStylesheetHrefs } from "@quanttrinh/qui/ssr";
export type {
  QuiStylesBundleAsset,
  QuiStylesHref,
  QuiStylesHrefResolver,
  QuiStylesHrefValue,
  QuiStylesResolverContext,
} from "@quanttrinh/qui/ssr";
export { stylesheetLinkHtml, type StylesheetLinkOptions } from "@quanttrinh/qui/internal";

export interface ServerRenderOptions extends HydrateRenderOptions {
  /** Component/app stylesheet managed in documents and shadow roots. */
  styles?: ShadowStylesheetOptions;
}

export interface RegistrationMetadata {
  /** Component tags found in the rendered HTML, sorted and deduplicated. */
  components: string[];
  /** Static ES module source that imports and defines every component. */
  module: string;
  /** JSON manifest compatible with virtual:qui/registration-manifest. */
  manifest: string;
}

export interface ServerRenderResult {
  html: string;
  diagnostics: unknown[];
  /** Output-aware registration metadata for the rendered components. */
  registration: RegistrationMetadata;
  /** Component tags found in the rendered HTML, sorted and deduplicated. */
  components: string[];
}

export interface PageRenderOptions extends ServerRenderOptions {
  /** Document title. */
  title?: string;
  /** Document-only theme stylesheet URL(s). */
  themeHref?: string | string[];
  /** Extra markup appended to the generated `<head>`. */
  head?: string;
  /** Attributes for the generated `<html>` element. */
  htmlAttributes?: Record<string, string | undefined>;
  /** Attributes for the generated `<body>` element. */
  bodyAttributes?: Record<string, string | undefined>;
}

export interface StreamRenderOptions extends PageRenderOptions {
  /** Override the generated document prefix. */
  prefix?: string;
  /** Override the generated document suffix. */
  suffix?: string;
  /** Receives diagnostics once the component tree has rendered. */
  onDiagnostics?: (diagnostics: unknown[]) => void;
  /** Receives component tags found in the rendered fragment. */
  onComponents?: (components: string[]) => void;
}

export interface QuiRenderer {
  render: (markup: string, options?: ServerRenderOptions) => Promise<ServerRenderResult>;
  renderPage: (markup: string, options?: PageRenderOptions) => Promise<ServerRenderResult>;
  stream: (markup: string, options?: StreamRenderOptions) => AsyncGenerator<string>;
  hydrate: (document: Document, options?: ServerRenderOptions) => Promise<ServerRenderResult>;
}

function isParseNode(value: unknown): value is DefaultTreeAdapterTypes.Node {
  return typeof value === "object" && value !== null && "nodeName" in value;
}

/** Collects component tags from rendered HTML using parse5. */
export function collectComponents(html: string): string[] {
  const components = new Set<string>();
  const visit = (node: DefaultTreeAdapterTypes.Node): void => {
    if ("tagName" in node && node.tagName.startsWith("qui-")) {
      components.add(node.tagName);
    }
    if ("childNodes" in node) {
      for (const child of node.childNodes) {
        visit(child);
      }
    }
    if ("content" in node) {
      const content: unknown = Reflect.get(node, "content");
      if (isParseNode(content)) {
        visit(content);
      }
    }
  };

  visit(parseFragment(html));
  return [...components].toSorted();
}

function registrationMetadata(html: string): RegistrationMetadata {
  const components = collectComponents(html);
  return {
    components,
    module: componentRegistrationModule(components),
    manifest: JSON.stringify({ components }),
  };
}

/**
 * Writes a registration manifest that `virtual:qui/registration-manifest` in
 * `@quanttrinh/qui-unplugin` reads during the client build.
 */
export async function writeRegistrationManifest(
  file: string,
  components: Iterable<string>,
): Promise<string> {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(
    file,
    `${JSON.stringify({ components: normalizeComponentTags(components) }, null, 2)}\n`,
  );
  return file;
}

function attributes(values: Record<string, string | undefined> | undefined): string {
  if (values === undefined) {
    return "";
  }
  const markup: string[] = [];
  for (const [name, value] of Object.entries(values)) {
    if (typeof value === "string" && value.length > 0) {
      markup.push(` ${name}="${escapeAttribute(value)}"`);
    }
  }
  return markup.join("");
}

function pageParts(options: PageRenderOptions): { prefix: string; suffix: string } {
  const htmlAttributes: Record<string, string | undefined> = {
    ...(options.language === undefined ? {} : { lang: options.language }),
    ...(options.direction === undefined ? {} : { dir: options.direction }),
    ...options.htmlAttributes,
  };
  const title = options.title === undefined ? "" : `<title>${escapeText(options.title)}</title>`;
  const theme =
    options.themeHref === undefined
      ? ""
      : stylesheetLinkHtml(uniqueHrefs(options.themeHref), { marker: false });
  const componentStyles =
    options.styles === undefined
      ? ""
      : stylesheetLinkHtml(uniqueHrefs(options.styles.href), { nonce: options.styles.nonce });

  const prefix = [
    "<!doctype html><html",
    attributes(htmlAttributes),
    '><head><meta charset="utf-8">',
    title,
    theme,
    componentStyles,
    options.head ?? "",
    "</head><body",
    attributes(options.bodyAttributes),
    ">",
  ].join("");

  return { prefix, suffix: "</body></html>" };
}

function renderOptions(options: ServerRenderOptions): HydrateRenderOptions {
  const { styles, ...render } = options;
  return styles === undefined ? render : withShadowStylesheet(styles, render);
}

/**
 * Hydrates an existing document and always returns serialized HTML. This wraps
 * Stencil's `hydrateDocument`, which otherwise returns `html: null` unless a
 * non-public serialization option is supplied.
 */
export async function hydrateDocument(
  document: Document,
  options: ServerRenderOptions = {},
): Promise<ServerRenderResult> {
  const hydrateOptions = {
    ...renderOptions(options),
    serializeToHtml: true,
  };
  const result = await stencilHydrateDocument(document, hydrateOptions);
  const html = result.html ?? "";
  const registration = registrationMetadata(html);
  return {
    html,
    diagnostics: result.diagnostics,
    registration,
    components: registration.components,
  };
}

/** Renders a fragment to serialized HTML with styles applied. */
export async function renderToString(
  markup: string,
  options: ServerRenderOptions = {},
): Promise<ServerRenderResult> {
  const result = await stencilRenderToString(markup, renderOptions(options));
  const html = result.html ?? "";
  const registration = registrationMetadata(html);
  return {
    html,
    diagnostics: result.diagnostics,
    registration,
    components: registration.components,
  };
}

/**
 * Renders a complete document with a generated head, theme link, marked
 * component stylesheet link, and the rendered component body.
 */
export async function renderPage(
  markup: string,
  options: PageRenderOptions = {},
): Promise<ServerRenderResult> {
  const {
    head: _head,
    themeHref: _themeHref,
    htmlAttributes: _htmlAttributes,
    bodyAttributes: _bodyAttributes,
    ...render
  } = options;
  const { prefix, suffix } = pageParts(options);
  const result = await renderToString(markup, { ...render, fullDocument: false });
  const html = `${prefix}${result.html}${suffix}`;
  const registration = registrationMetadata(result.html);

  return {
    html,
    diagnostics: result.diagnostics,
    registration,
    components: registration.components,
  };
}

/**
 * Streams a document shell before rendering the component tree.
 *
 * When `prefix`/`suffix` are omitted, a complete document shell is generated
 * from `styles`, `themeHref`, `title`, and the other page options. Stencil
 * buffers the component body, so the shell flushes early but the body is not
 * progressive.
 */
export async function* renderToStream(
  markup: string,
  options: StreamRenderOptions = {},
): AsyncGenerator<string> {
  const {
    prefix,
    suffix,
    onDiagnostics,
    onComponents,
    head: _head,
    themeHref: _themeHref,
    htmlAttributes: _htmlAttributes,
    bodyAttributes: _bodyAttributes,
    ...render
  } = options;
  const generated = pageParts(options);
  const documentPrefix = prefix ?? generated.prefix;
  const documentSuffix = suffix ?? generated.suffix;

  if (documentPrefix.length > 0) {
    yield documentPrefix;
  }

  const result = await renderToString(markup, { ...render, fullDocument: false });
  onDiagnostics?.(result.diagnostics);
  onComponents?.(result.components);

  if (result.html.length > 0) {
    yield result.html;
  }
  if (documentSuffix.length > 0) {
    yield documentSuffix;
  }
}

/**
 * Creates a server-first renderer with shared defaults.
 *
 * ```ts
 * const qui = createQuiRenderer({
 *   styles: { href: "/assets/qui.css" },
 *   themeHref: "/assets/theme.css",
 * });
 *
 * const { html, components } = await qui.renderPage(markup, { title: "Home" });
 * ```
 */
export function createQuiRenderer(defaults: PageRenderOptions = {}): QuiRenderer {
  return {
    async render(markup, options = {}) {
      const result = await renderToString(markup, { ...defaults, ...options });
      return result;
    },
    async renderPage(markup, options = {}) {
      const result = await renderPage(markup, { ...defaults, ...options });
      return result;
    },
    stream(markup, options = {}) {
      return renderToStream(markup, { ...defaults, ...options });
    },
    async hydrate(document, options = {}) {
      const result = await hydrateDocument(document, { ...defaults, ...options });
      return result;
    },
  };
}

function isHydrateWindow(value: unknown): value is { document: Document } {
  if (typeof value !== "object" || value === null || !("document" in value)) {
    return false;
  }
  const document: unknown = Reflect.get(value, "document");
  return typeof document === "object" && document !== null;
}

/** Creates a mock window with a typed document for hydrateDocument(). */
export function createWindowFromHtml(html: string, uniqueId: string): { document: Document } {
  const window: unknown = stencilCreateWindowFromHtml(html, uniqueId);
  if (!isHydrateWindow(window)) {
    throw new Error("Stencil did not return a hydrate window with a document.");
  }
  return window;
}

import { SHADOW_STYLES_HOST_SELECTOR, uniqueHrefs } from "../internal";
import {
  reconcileDocumentStylesheetLinks,
  reconcileShadowStylesheetLinks,
  resolveStylesheetNonce,
} from "../styles/links";

export { isStylesHrefValue, resolveStylesheetHrefs } from "../internal";
export type {
  QuiStylesBundleAsset,
  QuiStylesHref,
  QuiStylesHrefResolver,
  QuiStylesHrefValue,
  QuiStylesResolverContext,
} from "../internal";

export interface ShadowStylesheetOptions {
  /**
   * Component/app stylesheet URL used in each styled shadow root. This must not
   * point at `theme.css`, which is document-only.
   */
  href: string | string[];
  /**
   * CSP nonce for generated stylesheet links. Defaults to the document's
   * `meta[name="csp-nonce"]` value when present.
   */
  nonce?: string;
}

/**
 * Stencil's hydrate type is not exported through a resolvable subpath in the
 * installed package, so mirror the options this package supports.
 */
export interface HydrateRenderOptions {
  approximateLineWidth?: number;
  afterHydrate?: (document: Document) => unknown;
  beforeHydrate?: (document: Document) => unknown;
  buildId?: string;
  canonicalUrl?: string;
  clientHydrateAnnotations?: boolean;
  constrainTimeouts?: boolean;
  cookie?: string;
  direction?: string;
  excludeComponents?: string[];
  fullDocument?: boolean;
  language?: string;
  maxHydrateCount?: number;
  prettyHtml?: boolean;
  referrer?: string;
  removeAttributeQuotes?: boolean;
  removeBooleanAttributeQuotes?: boolean;
  removeEmptyAttributes?: boolean;
  removeHtmlComments?: boolean;
  removeScripts?: boolean;
  removeUnusedStyles?: boolean;
  resourcesUrl?: string;
  runtimeLogging?: boolean;
  serializeShadowRoot?: "declarative-shadow-dom" | false;
  staticComponents?: string[];
  timeout?: number;
  title?: string;
  url?: string;
  userAgent?: string;
  [key: string]: unknown;
}

interface InjectionContext {
  document: Document;
  hrefs: string[];
  nonce?: string;
}

function visitStylableRoots(context: InjectionContext, root: Document | ShadowRoot): void {
  for (const element of root.querySelectorAll(SHADOW_STYLES_HOST_SELECTOR)) {
    const { shadowRoot } = element;
    if (shadowRoot) {
      reconcileShadowStylesheetLinks(shadowRoot, context.hrefs, {
        document: context.document,
        nonce: context.nonce,
      });
      visitStylableRoots(context, shadowRoot);
    }
  }
}

/**
 * Adds the document-level component/app stylesheet link. Existing matching
 * stylesheet links are marked with `data-qui-styles`, and managed links are
 * reconciled to the configured hrefs so the client runtime can discover the
 * same URL. Safe to call during SSR; it only touches the document it is given.
 */
export function injectDocumentStylesheet(
  document: Document,
  options: ShadowStylesheetOptions,
): void {
  const hrefs = uniqueHrefs(options.href);
  if (hrefs.length === 0) {
    return;
  }

  reconcileDocumentStylesheetLinks(document, hrefs, {
    create: true,
    markExisting: true,
    nonce: resolveStylesheetNonce(document, options.nonce),
  });
}

/**
 * Adds external stylesheet links to every marked component shadow root in a
 * hydrated document. Components mark their host when they call
 * `ensureShadowStylesheet()` during SSR. Safe to call during SSR because it only
 * touches the document it is given and performs no work at module load.
 *
 * `withShadowStylesheet()` normally does not need this helper: adding the
 * document link before hydration lets components inject their own shadow links.
 * Call it directly when hydrating a document that is already hydrated or when
 * you manage the document lifecycle yourself.
 */
export function injectShadowStylesheet(document: Document, options: ShadowStylesheetOptions): void {
  const hrefs = uniqueHrefs(options.href);
  if (hrefs.length > 0) {
    visitStylableRoots(
      { document, hrefs, nonce: resolveStylesheetNonce(document, options.nonce) },
      document,
    );
  }
}

/**
 * Returns Stencil hydrate options that make the document link discoverable
 * before hydration. Components then inject their own shadow stylesheet links
 * while they connect, so no second document traversal is required.
 *
 * For documents that are already hydrated, call `injectShadowStylesheet()`
 * directly instead.
 */
export function withShadowStylesheet(
  options: ShadowStylesheetOptions,
  renderOptions: HydrateRenderOptions = {},
): HydrateRenderOptions {
  const { beforeHydrate } = renderOptions;
  const serializeShadowRoot: unknown = renderOptions.serializeShadowRoot;
  if (
    serializeShadowRoot !== undefined &&
    serializeShadowRoot !== false &&
    serializeShadowRoot !== "declarative-shadow-dom"
  ) {
    throw new Error(
      "qui SSR supports only declarative shadow DOM. Use serializeShadowRoot: 'declarative-shadow-dom' or false.",
    );
  }

  return {
    ...renderOptions,
    beforeHydrate(document: Document) {
      injectDocumentStylesheet(document, options);
      return beforeHydrate?.(document);
    },
  };
}

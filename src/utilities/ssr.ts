export interface ShadowStylesheetOptions {
  href: string | string[];
  tagPrefix?: string;
  attribute?: string;
}

/**
 * Stencil's hydrate type is not exported through a resolvable subpath in the
 * installed package, so keep the minimal shape this helper relies on.
 */
interface SerializeDocumentOptions {
  afterHydrate?: (document: Document) => unknown;
  [key: string]: unknown;
}

type StylesheetRoot = Document | ShadowRoot;

interface InjectionContext {
  document: Document;
  hrefs: string[];
  tagPrefix: string;
  attribute: string;
}

const DEFAULT_TAG_PREFIX = "qui-";
const DEFAULT_ATTRIBUTE = "data-qui-styles";

function injectStylesheetLinks(context: InjectionContext, root: StylesheetRoot): void {
  const { attribute, document, hrefs } = context;
  const existing = new Set<string>();
  for (const link of root.querySelectorAll("link")) {
    if (link.hasAttribute(attribute)) {
      existing.add(link.getAttribute("href") ?? "");
    }
  }

  const reference = root.firstChild;
  for (const href of hrefs) {
    if (!existing.has(href)) {
      const link = document.createElement("link");
      link.setAttribute("rel", "stylesheet");
      link.setAttribute("href", href);
      link.setAttribute(attribute, "");
      if (reference) {
        // Stencil's mock document does not implement Element.before().
        // oxlint-disable-next-line unicorn/prefer-modern-dom-apis
        root.insertBefore(link, reference);
      } else {
        root.append(link);
      }
      existing.add(href);
    }
  }
}

function visitRoot(context: InjectionContext, root: StylesheetRoot): void {
  for (const element of root.querySelectorAll("*")) {
    const { shadowRoot } = element;
    if (shadowRoot) {
      if (element.tagName.toLowerCase().startsWith(context.tagPrefix)) {
        injectStylesheetLinks(context, shadowRoot);
      }
      visitRoot(context, shadowRoot);
    }
  }
}

/**
 * Adds external stylesheet links to every matching custom element shadow root
 * in a hydrated document. Safe to call during SSR because it only touches the
 * document it is given and performs no work at module load.
 */
export function injectShadowStylesheet(document: Document, options: ShadowStylesheetOptions): void {
  const hrefs = Array.isArray(options.href) ? options.href : [options.href];
  if (hrefs.length > 0) {
    visitRoot(
      {
        document,
        hrefs,
        tagPrefix: (options.tagPrefix ?? DEFAULT_TAG_PREFIX).toLowerCase(),
        attribute: options.attribute ?? DEFAULT_ATTRIBUTE,
      },
      document,
    );
  }
}

/**
 * Returns Stencil hydrate options that inject shadow stylesheet links before
 * running a caller-provided `afterHydrate` hook.
 */
export function withShadowStylesheet(
  options: ShadowStylesheetOptions,
  renderOptions: SerializeDocumentOptions = {},
): SerializeDocumentOptions {
  const { afterHydrate } = renderOptions;

  return {
    ...renderOptions,
    afterHydrate(document: Document) {
      injectShadowStylesheet(document, options);
      return afterHydrate?.(document);
    },
  };
}

const DEFAULT_ATTRIBUTE = "data-qui-styles";
/** Set by components that call `ensureShadowStylesheet`. */
export const SHADOW_STYLES_MARKER = "data-qui-shadow-styles";

const discoveredHrefs = new WeakMap<Document, string[] | undefined>();
const documentObservers = new WeakMap<Document, MutationObserver>();

/**
 * Local copy of the DOM helper so the published runtime stays a self-contained
 * module. The compiled utility entry point does not ship `src/helpers`.
 */
function isElement(value: unknown): value is Element {
  return value instanceof Element;
}
// oxlint-disable-next-line stencil/ban-side-effects -- Symbol.for is a pure global registry lookup.
const GLOBAL_HREF_KEY = Symbol.for("@quanttrinh/qui/styles-href");

function isHref(value: unknown): value is string | string[] {
  return (
    typeof value === "string" ||
    (Array.isArray(value) && value.every((entry) => typeof entry === "string"))
  );
}

/**
 * Reads the configured href from the global object so separately bundled
 * runtime and component modules observe the same configuration.
 */
function configuredHref(): string | string[] | undefined {
  const value: unknown = Reflect.get(globalThis, GLOBAL_HREF_KEY);
  return isHref(value) ? value : undefined;
}

function uniqueHrefs(href: string | string[]): string[] {
  const values = Array.isArray(href) ? href : [href];
  const hrefs: string[] = [];

  for (const value of values) {
    if (value.length > 0 && !hrefs.includes(value)) {
      hrefs.push(value);
    }
  }

  return hrefs;
}

function getDocument(host?: HTMLElement): Document | undefined {
  if (host?.ownerDocument) {
    return host.ownerDocument;
  }

  // Reading the global lazily keeps this module safe to import during SSR.
  return typeof document === "undefined" ? undefined : document;
}

function containsLink(node: Node): boolean {
  return isElement(node) && (node.tagName === "LINK" || node.querySelector("link") !== null);
}

function hasLinkMutation(records: MutationRecord[]): boolean {
  return records.some((record) => {
    if (record.type === "attributes") {
      return isElement(record.target) && record.target.tagName === "LINK";
    }
    return [...record.addedNodes, ...record.removedNodes].some((node) => containsLink(node));
  });
}

function invalidateDocumentLinkCache(document: Document): void {
  documentObservers.get(document)?.disconnect();
  documentObservers.delete(document);
  discoveredHrefs.delete(document);
}

function discoverDocumentHrefs(document: Document): string[] | undefined {
  if (discoveredHrefs.has(document)) {
    return discoveredHrefs.get(document);
  }

  const hrefs: string[] = [];
  for (const link of document.querySelectorAll("link")) {
    if (link.hasAttribute(DEFAULT_ATTRIBUTE)) {
      const href = link.getAttribute("href");
      if (typeof href === "string" && href.length > 0 && !hrefs.includes(href)) {
        hrefs.push(href);
      }
    }
  }

  const result = hrefs.length > 0 ? hrefs : undefined;
  discoveredHrefs.set(document, result);

  if (!documentObservers.has(document) && typeof MutationObserver !== "undefined") {
    const observer = new MutationObserver((records) => {
      if (hasLinkMutation(records)) {
        invalidateDocumentLinkCache(document);
      }
    });
    observer.observe(document.documentElement, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["href", DEFAULT_ATTRIBUTE],
    });
    documentObservers.set(document, observer);
  }

  return result;
}

function resolveHrefs(document: Document): string[] | undefined {
  const configured = configuredHref();
  if (configured !== undefined) {
    return uniqueHrefs(configured);
  }

  return discoverDocumentHrefs(document);
}

function hasManagedLink(root: ShadowRoot): boolean {
  for (const link of root.querySelectorAll("link")) {
    if (link.hasAttribute(DEFAULT_ATTRIBUTE)) {
      return true;
    }
  }

  return false;
}

function createStylesheetLink(document: Document, href: string): HTMLLinkElement {
  const link = document.createElement("link");
  link.setAttribute("rel", "stylesheet");
  link.setAttribute("href", href);
  link.setAttribute(DEFAULT_ATTRIBUTE, "");
  return link;
}

/** Reconciles marked document links so their hrefs match the configured list. */
function reconcileDocumentStylesheetLinks(document: Document, hrefs: string[]): void {
  const links: HTMLLinkElement[] = [];
  for (const link of document.querySelectorAll("link")) {
    if (link.hasAttribute(DEFAULT_ATTRIBUTE)) {
      links.push(link);
    }
  }

  for (const [index, link] of links.entries()) {
    if (index < hrefs.length) {
      const href = hrefs[index];
      if (link.getAttribute("href") !== href) {
        link.setAttribute("href", href);
      }
    } else {
      link.remove();
    }
  }
}

/**
 * Reconciles the managed links in a shadow root with the configured hrefs.
 * Existing links are updated in place, missing links are added in order, and
 * surplus managed links are removed. Only links carrying the marker attribute
 * are touched, so unmanaged links are left alone.
 */
function reconcileStylesheetLinks(root: ShadowRoot, document: Document, hrefs: string[]): void {
  const managed: HTMLLinkElement[] = [];

  for (const link of root.querySelectorAll("link")) {
    if (link.hasAttribute(DEFAULT_ATTRIBUTE)) {
      managed.push(link);
    }
  }

  for (const [index, href] of hrefs.entries()) {
    if (index < managed.length) {
      const link = managed[index];
      if (link.getAttribute("href") !== href) {
        link.setAttribute("href", href);
      }
    } else {
      const created = createStylesheetLink(document, href);
      const reference = managed.length > 0 ? managed.at(-1)?.nextSibling : root.firstChild;

      if (reference) {
        // Stencil's mock document does not implement Element.before().
        // oxlint-disable-next-line unicorn/prefer-modern-dom-apis
        root.insertBefore(created, reference);
      } else {
        root.append(created);
      }

      managed.push(created);
    }
  }

  for (const link of managed.slice(hrefs.length)) {
    link.remove();
  }
}

/**
 * Collects shadow roots whose hosts opted into styling. Nested marked hosts are
 * visited as well, without walking unrelated shadow roots.
 */
function collectShadowRoots(root: ParentNode): ShadowRoot[] {
  const roots: ShadowRoot[] = [];
  const visit = (parent: ParentNode): void => {
    for (const element of parent.querySelectorAll(`[${SHADOW_STYLES_MARKER}]`)) {
      const { shadowRoot } = element;
      if (shadowRoot) {
        roots.push(shadowRoot);
        visit(shadowRoot);
      }
    }
  };

  visit(root);
  return roots;
}

/**
 * Adds the configured stylesheet link(s) to a styled component shadow root.
 *
 * Styled components call this from their lifecycle, which also marks the host
 * for SSR and later stylesheet updates. Data-only and host-only parts
 * deliberately do not call it. The helper is conservative about missing roots,
 * documents, and existing `data-qui-styles` links.
 *
 * If no href has been configured, the first document link marked with
 * `data-qui-styles` is used as the source of truth. Without either source the
 * helper is a no-op.
 */
export function ensureShadowStylesheet(host: HTMLElement): void {
  const root = host.shadowRoot;
  if (!root) {
    return;
  }

  host.setAttribute(SHADOW_STYLES_MARKER, "");
  const document = getDocument(host);
  if (!document) {
    return;
  }

  if (hasManagedLink(root)) {
    return;
  }

  const hrefs = resolveHrefs(document);
  if (!hrefs) {
    return;
  }

  reconcileStylesheetLinks(root, document, hrefs);
}

/**
 * Configures the component/app stylesheet href(s) used by
 * `ensureShadowStylesheet`.
 *
 * Pass `styles.css` or the app's combined component stylesheet. Never pass
 * `theme.css`: the theme is document-only and its custom properties inherit
 * into shadow roots.
 *
 * When a document is available, marked document links, existing styled
 * `qui-*` shadow roots, and roots that already contain a managed link are
 * reconciled immediately. Components that connect later pick up the configuration through
 * `ensureShadowStylesheet`. This call is safe during SSR; without a document it
 * only stores the value.
 */
export function setQuiStylesHref(href: string | string[]): void {
  const value = Array.isArray(href) ? uniqueHrefs(href) : href;
  Reflect.set(globalThis, GLOBAL_HREF_KEY, value);

  const document = getDocument();
  if (!document) {
    return;
  }

  const hrefs = uniqueHrefs(value);
  invalidateDocumentLinkCache(document);
  reconcileDocumentStylesheetLinks(document, hrefs);
  for (const root of collectShadowRoots(document)) {
    reconcileStylesheetLinks(root, document, hrefs);
  }
}

/** Clears the configured href and managed shadow-root links. */
export function resetQuiStylesHref(): void {
  Reflect.deleteProperty(globalThis, GLOBAL_HREF_KEY);
  const document = getDocument();
  if (!document) {
    return;
  }
  invalidateDocumentLinkCache(document);
  for (const root of collectShadowRoots(document)) {
    reconcileStylesheetLinks(root, document, []);
  }
}

/**
 * Returns the configured href(s), or the href(s) discovered from a document
 * `link[data-qui-styles]` when nothing has been configured yet. A single
 * discovered href is returned as a string, matching the configured input
 * shape. Returns `undefined` during SSR or when no source is available.
 */
export function getQuiStylesHref(): string | string[] | undefined {
  const configured = configuredHref();
  if (configured !== undefined) {
    return Array.isArray(configured) ? [...configured] : configured;
  }

  const document = getDocument();
  if (!document) {
    return undefined;
  }

  const hrefs = discoverDocumentHrefs(document);
  if (!hrefs) {
    return undefined;
  }

  return hrefs.length === 1 ? hrefs[0] : hrefs;
}

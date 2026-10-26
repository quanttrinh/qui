const DEFAULT_ATTRIBUTE = "data-qui-styles";
const QUI_TAG_PREFIX = "qui-";
const SKIPPED_TAGS = new Set(["qui-option", "qui-dialog"]);
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

function discoverDocumentHrefs(document: Document): string[] | undefined {
  const hrefs: string[] = [];

  for (const link of document.querySelectorAll("link")) {
    if (link.hasAttribute(DEFAULT_ATTRIBUTE)) {
      const href = link.getAttribute("href");
      if (typeof href === "string" && href.length > 0 && !hrefs.includes(href)) {
        hrefs.push(href);
      }
    }
  }

  return hrefs.length > 0 ? hrefs : undefined;
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
 * Collects shadow roots belonging to `qui-*` hosts or roots that already carry
 * a managed stylesheet link. Nested shadow roots are visited as well.
 */
function collectShadowRoots(root: ParentNode): ShadowRoot[] {
  const roots: ShadowRoot[] = [];

  for (const element of root.querySelectorAll("*")) {
    const { shadowRoot } = element;
    if (shadowRoot) {
      const tagName = element.tagName.toLowerCase();
      const isQuiHost = tagName.startsWith(QUI_TAG_PREFIX);
      if ((isQuiHost && !SKIPPED_TAGS.has(tagName)) || hasManagedLink(shadowRoot)) {
        roots.push(shadowRoot);
      }

      roots.push(...collectShadowRoots(shadowRoot));
    }
  }

  return roots;
}

/**
 * Adds the configured stylesheet link(s) to a component shadow root.
 *
 * The helper is intentionally conservative: it does nothing when the host has
 * no shadow root, when there is no document to create links with, or when the
 * root already contains a `data-qui-styles` link. This preserves links emitted
 * by SSR and prevents duplicate styles for dynamically created components.
 *
 * If no href has been configured, the first document link marked with
 * `data-qui-styles` is used as the source of truth. Without either source the
 * helper is a no-op.
 */
export function ensureShadowStylesheet(host: HTMLElement): void {
  if (SKIPPED_TAGS.has(host.tagName.toLowerCase())) {
    return;
  }
  const root = host.shadowRoot;
  if (!root) {
    return;
  }

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
 * Configures the stylesheet href(s) used by `ensureShadowStylesheet`.
 *
 * When a document is available, existing `qui-*` shadow roots and roots that
 * already contain a managed link are reconciled immediately. Components that
 * connect later pick up the configuration through `ensureShadowStylesheet`.
 * This call is safe during SSR; without a document it only stores the value.
 */
export function setQuiStylesHref(href: string | string[]): void {
  const value = Array.isArray(href) ? uniqueHrefs(href) : href;
  Reflect.set(globalThis, GLOBAL_HREF_KEY, value);

  const document = getDocument();
  if (!document) {
    return;
  }

  const hrefs = uniqueHrefs(value);
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

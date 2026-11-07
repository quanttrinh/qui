import { insertBefore } from "../insert-before";
import { isPrimaryStylesheetRel, STYLESHEET_ATTRIBUTE, STYLESHEET_SELECTOR } from "../internal";

const documentNonces = new WeakMap<Document, string | undefined>();

function discoverDocumentNonce(document: Document): string | undefined {
  if (documentNonces.has(document)) {
    return documentNonces.get(document);
  }

  let nonce: string | undefined;
  for (const link of document.querySelectorAll<HTMLLinkElement>(STYLESHEET_SELECTOR)) {
    const value = link.getAttribute("nonce");
    if (typeof value === "string" && value.length > 0) {
      nonce = value;
      break;
    }
  }

  if (nonce === undefined) {
    for (const meta of document.querySelectorAll<HTMLMetaElement>("meta")) {
      if (meta.getAttribute("name") === "csp-nonce") {
        const content = meta.getAttribute("content");
        if (typeof content === "string" && content.length > 0) {
          nonce = content;
          break;
        }
      }
    }
  }

  documentNonces.set(document, nonce);
  return nonce;
}

/**
 * Resolves the nonce used for generated stylesheet links. An explicit value
 * wins, then a nonce already present on a managed document link, then the
 * document's `meta[name="csp-nonce"]`. Discovery is cached per document.
 */
export function resolveStylesheetNonce(
  document: Document,
  nonce: string | undefined,
): string | undefined {
  if (nonce !== undefined && nonce.length > 0) {
    return nonce;
  }
  return discoverDocumentNonce(document);
}

/** Applies a CSP nonce to a managed link unless it already has one. */
export function applyStylesheetNonce(link: HTMLLinkElement, nonce: string | undefined): void {
  if (nonce !== undefined && !link.hasAttribute("nonce")) {
    link.setAttribute("nonce", nonce);
  }
}

/** Creates a marked stylesheet link, optionally with a CSP nonce. */
export function createStylesheetLink(
  document: Document,
  href: string,
  nonce: string | undefined,
): HTMLLinkElement {
  const link = document.createElement("link");
  link.setAttribute("rel", "stylesheet");
  link.setAttribute("href", href);
  link.setAttribute(STYLESHEET_ATTRIBUTE, "");
  applyStylesheetNonce(link, nonce);
  return link;
}

/**
 * Finds an unmarked primary stylesheet link with the given href. Used to adopt
 * markup that already contains the stylesheet before any run-time marker.
 */
export function findMatchingStylesheetLink(
  document: Document,
  href: string,
): HTMLLinkElement | undefined {
  for (const link of document.querySelectorAll<HTMLLinkElement>("link")) {
    if (
      !link.hasAttribute(STYLESHEET_ATTRIBUTE) &&
      isPrimaryStylesheetRel(link.getAttribute("rel")) &&
      link.getAttribute("href") === href
    ) {
      return link;
    }
  }
  return undefined;
}

export interface ReconcileDocumentStylesheetOptions {
  /** Create a document link when no managed or matching link exists. */
  create?: boolean;
  /** Adopt an existing unmarked stylesheet link that matches the href. */
  markExisting?: boolean;
  /** CSP nonce applied to managed links that do not already have one. */
  nonce?: string;
}

/** Keeps managed head links in the configured cascade order. */
function reorderHeadLinks(document: Document, links: (HTMLLinkElement | undefined)[]): void {
  let previous: HTMLLinkElement | undefined;
  for (const link of links) {
    if (link !== undefined && link.parentNode === document.head) {
      if (previous !== undefined && link.previousSibling !== previous) {
        link.remove();
        document.head.insertBefore(link, previous.nextSibling);
      }
      previous = link;
    }
  }
}

function indexManagedLinks(managed: HTMLLinkElement[]): Map<string, HTMLLinkElement> {
  const byHref = new Map<string, HTMLLinkElement>();
  for (const link of managed) {
    const href = link.getAttribute("href");
    if (href !== null && !byHref.has(href)) {
      byHref.set(href, link);
    }
  }
  return byHref;
}

function claimExactLinks(
  hrefs: string[],
  managedByHref: Map<string, HTMLLinkElement>,
  claimed: Set<HTMLLinkElement>,
): (HTMLLinkElement | undefined)[] {
  return hrefs.map((href) => {
    const link = managedByHref.get(href);
    if (link === undefined) {
      return undefined;
    }
    managedByHref.delete(href);
    claimed.add(link);
    return link;
  });
}

interface LinkSelectionContext {
  document: Document;
  hrefs: string[];
  selected: (HTMLLinkElement | undefined)[];
  claimed: Set<HTMLLinkElement>;
}

function claimExistingLinks(context: LinkSelectionContext, markExisting: boolean): void {
  if (!markExisting) {
    return;
  }
  const { document, hrefs, selected, claimed } = context;
  for (const [index, href] of hrefs.entries()) {
    if (selected[index] === undefined) {
      const link = findMatchingStylesheetLink(document, href);
      if (link !== undefined) {
        claimed.add(link);
        selected[index] = link;
      }
    }
  }
}

function claimReusableLinks(context: LinkSelectionContext, reusable: HTMLLinkElement[]): void {
  const { hrefs, selected, claimed } = context;
  for (const index of hrefs.keys()) {
    if (selected[index] === undefined) {
      const link = reusable.shift();
      if (link !== undefined) {
        claimed.add(link);
        selected[index] = link;
      }
    }
  }
}

function ensureStylesheetLinks(
  context: LinkSelectionContext,
  create: boolean,
  nonce?: string,
): void {
  const { document, hrefs, selected, claimed } = context;
  for (const [index, href] of hrefs.entries()) {
    let link = selected[index];
    if (link === undefined && create) {
      link = createStylesheetLink(document, href, nonce);
      document.head.append(link);
      claimed.add(link);
      selected[index] = link;
    }
    if (link !== undefined) {
      if (link.getAttribute("href") !== href) {
        link.setAttribute("href", href);
      }
      link.setAttribute(STYLESHEET_ATTRIBUTE, "");
      applyStylesheetNonce(link, nonce);
    }
  }
}

function removeUnclaimedLinks(managed: HTMLLinkElement[], claimed: Set<HTMLLinkElement>): void {
  for (const link of managed) {
    if (!claimed.has(link)) {
      link.remove();
    }
  }
}

/**
 * Reconciles document-level marked stylesheet links with the configured hrefs.
 * Runtime callers only update links that were already marked. SSR callers can
 * opt into adopting existing matching links and creating missing ones.
 */
export function reconcileDocumentStylesheetLinks(
  document: Document,
  hrefs: string[],
  options: ReconcileDocumentStylesheetOptions = {},
): void {
  const { create = false, markExisting = false, nonce } = options;
  const managed = [...document.querySelectorAll<HTMLLinkElement>(STYLESHEET_SELECTOR)];
  documentNonces.delete(document);

  const claimed = new Set<HTMLLinkElement>();
  const selected = claimExactLinks(hrefs, indexManagedLinks(managed), claimed);

  const context: LinkSelectionContext = { document, hrefs, selected, claimed };
  claimExistingLinks(context, markExisting);
  claimReusableLinks(
    context,
    managed.filter((link) => !claimed.has(link)),
  );
  ensureStylesheetLinks(context, create, nonce);
  removeUnclaimedLinks(managed, claimed);
  reorderHeadLinks(document, selected);
}

export interface ReconcileShadowStylesheetOptions {
  document: Document;
  /** CSP nonce applied to managed links that do not already have one. */
  nonce?: string;
}

/**
 * Reconciles the marked links in a shadow root with the configured hrefs.
 * Existing links are updated in place, missing links are added in order, and
 * surplus managed links are removed. Unmanaged links are left alone.
 */
export function reconcileShadowStylesheetLinks(
  root: ShadowRoot,
  hrefs: string[],
  options: ReconcileShadowStylesheetOptions,
): void {
  const { document } = options;
  const nonce = resolveStylesheetNonce(document, options.nonce);
  const managed = [...root.querySelectorAll<HTMLLinkElement>(STYLESHEET_SELECTOR)];

  for (const link of managed) {
    applyStylesheetNonce(link, nonce);
  }

  for (const [index, href] of hrefs.entries()) {
    const link = managed.at(index);
    if (link === undefined) {
      const created = createStylesheetLink(document, href, nonce);
      const reference = managed.length > 0 ? managed.at(-1)?.nextSibling : root.firstChild;

      if (reference) {
        insertBefore(root, created, reference);
      } else {
        root.append(created);
      }

      managed.push(created);
    } else if (link.getAttribute("href") !== href) {
      link.setAttribute("href", href);
    }
  }

  for (const link of managed.slice(hrefs.length)) {
    link.remove();
  }
}

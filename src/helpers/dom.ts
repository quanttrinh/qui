/**
 * Runtime-safe element checks.
 *
 * Stencil's hydrate DOM exposes `HTMLElement` but not the concrete element
 * constructors such as `HTMLDivElement`. Checking `tagName` keeps the same
 * narrowing in browsers and server rendering without relying on those globals.
 */

export function isElement(value: unknown): value is Element {
  return value instanceof Element;
}

export function isHTMLElement(value: unknown): value is HTMLElement {
  return value instanceof HTMLElement;
}

export function isNode(value: unknown): value is Node {
  return (
    typeof value === "object" &&
    value !== null &&
    "nodeType" in value &&
    typeof value.nodeType === "number"
  );
}

export function isShadowRoot(node: Node): node is ShadowRoot {
  return node.nodeType === 11 && "host" in node;
}

export function isHTMLButtonElement(value: unknown): value is HTMLButtonElement {
  return isHTMLElement(value) && value.tagName === "BUTTON";
}

export function isHTMLDialogElement(value: unknown): value is HTMLDialogElement {
  return isHTMLElement(value) && value.tagName === "DIALOG";
}

export function isHTMLDivElement(value: unknown): value is HTMLDivElement {
  return isHTMLElement(value) && value.tagName === "DIV";
}

export function isHTMLFormElement(value: unknown): value is HTMLFormElement {
  return isHTMLElement(value) && value.tagName === "FORM";
}

export function isHTMLInputElement(value: unknown): value is HTMLInputElement {
  return isHTMLElement(value) && value.tagName === "INPUT";
}

export function isHTMLTextAreaElement(value: unknown): value is HTMLTextAreaElement {
  return isHTMLElement(value) && value.tagName === "TEXTAREA";
}

/**
 * Returns whether a subtree contains a tabbable descendant, including
 * focusable elements inside nested open shadow roots.
 */
export function hasFocusableDescendant(root: ParentNode): boolean {
  const selector = [
    "a[href]",
    "button:not([disabled])",
    "input:not([disabled])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    "summary",
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]',
  ].join(",");

  for (const element of root.querySelectorAll<HTMLElement>(selector)) {
    if (element.getAttribute("part") !== "panel" && element.closest("[hidden], [inert]") === null) {
      return true;
    }
  }

  for (const element of root.querySelectorAll<HTMLElement>("*")) {
    if (element.shadowRoot !== null && hasFocusableDescendant(element.shadowRoot)) {
      return true;
    }
  }

  return false;
}

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

export function isHTMLSlotElement(value: unknown): value is HTMLSlotElement {
  return isHTMLElement(value) && value.tagName === "SLOT";
}

export function isHTMLTextAreaElement(value: unknown): value is HTMLTextAreaElement {
  return isHTMLElement(value) && value.tagName === "TEXTAREA";
}

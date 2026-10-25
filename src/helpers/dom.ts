/**
 * Runtime-safe element checks.
 *
 * Stencil's hydrate DOM exposes `HTMLElement` but not the concrete element
 * constructors such as `HTMLDivElement`. Checking `tagName` keeps the same
 * narrowing in browsers and server rendering without relying on those globals.
 */

export function isHTMLElement(value: unknown): value is HTMLElement {
  return value instanceof HTMLElement;
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

export function isHTMLInputElement(value: unknown): value is HTMLInputElement {
  return isHTMLElement(value) && value.tagName === "INPUT";
}

export function isHTMLTextAreaElement(value: unknown): value is HTMLTextAreaElement {
  return isHTMLElement(value) && value.tagName === "TEXTAREA";
}

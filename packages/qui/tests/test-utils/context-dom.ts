/** Mock DOM used by the context protocol unit tests (event-capable, Stencil SSR DOM). */
import { MockWindow } from "@stencil/core/mock-doc";

const window = new MockWindow("http://localhost/");
export const contextDocument: Document = window.document;

export function createElement(tagName = "div"): HTMLElement {
  return contextDocument.createElement(tagName);
}

/** Creates `provider -> consumer` attached to the shared mock document. */
export function createTree(): { provider: HTMLElement; consumer: HTMLElement } {
  const provider = createElement();
  const consumer = createElement();
  provider.appendChild(consumer);
  contextDocument.body.appendChild(provider);
  return { provider, consumer };
}

/** Creates a host inside a shadow root and returns it with its shadow host. */
export function createShadowTree(): { host: HTMLElement; shadowHost: HTMLElement } {
  const shadowHost = createElement();
  contextDocument.body.appendChild(shadowHost);
  const host: HTMLElement = shadowHost.attachShadow({ mode: "open" }).appendChild(createElement());
  return { host, shadowHost };
}

export function cleanup(...elements: HTMLElement[]): void {
  for (const element of elements) {
    element.remove();
  }
}

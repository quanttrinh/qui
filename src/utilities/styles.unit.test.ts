import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  createFakeDocument,
  createHost,
  type FakeDocument,
  type FakeNode,
  linkHrefs,
} from "../test-utils/fake-dom";

interface StylesModule {
  ensureShadowStylesheet: (host: HTMLElement) => void;
  getQuiStylesHref: () => string | string[] | undefined;
  setQuiStylesHref: (href: string | string[]) => void;
  resetQuiStylesHref: () => void;
}

let styles: StylesModule;

const MARKER_ATTRIBUTE = "data-qui-styles";

function createDocumentLink(document: FakeDocument, href: string): FakeNode {
  const link = document.createElement("link");
  link.setAttribute("rel", "stylesheet");
  link.setAttribute("href", href);
  link.setAttribute(MARKER_ATTRIBUTE, "");
  document.append(link);
  return link;
}

function useDocument(document: FakeDocument): void {
  Object.defineProperty(globalThis, "document", {
    configurable: true,
    writable: true,
    value: document,
  });
}

beforeEach(async () => {
  vi.resetModules();
  styles = await import("./styles");
});

afterEach(() => {
  Reflect.deleteProperty(globalThis, "document");
  Reflect.deleteProperty(globalThis, Symbol.for("@quanttrinh/qui/styles-href"));
});

describe("ensureShadowStylesheet", () => {
  it("is a no-op without configuration or a document link", () => {
    const document = createFakeDocument();
    useDocument(document);
    const { host, root } = createHost(document);

    styles.ensureShadowStylesheet(host as unknown as HTMLElement);

    expect(root.children).toEqual([]);
    expect(styles.getQuiStylesHref()).toBeUndefined();
  });

  it("does nothing when the host has no shadow root", () => {
    const document = createFakeDocument();
    useDocument(document);
    styles.setQuiStylesHref("/assets/qui.css");
    const host = document.createElement("qui-card");

    styles.ensureShadowStylesheet(host as unknown as HTMLElement);

    expect(host.children).toEqual([]);
  });

  it("adds a configured string href", () => {
    const document = createFakeDocument();
    useDocument(document);
    const { host, root } = createHost(document);
    styles.setQuiStylesHref("/assets/qui.css");

    styles.ensureShadowStylesheet(host as unknown as HTMLElement);

    expect(linkHrefs(root)).toEqual(["/assets/qui.css"]);
    expect(root.children[0]?.getAttribute("rel")).toBe("stylesheet");
    expect(root.children[0]?.hasAttribute(MARKER_ATTRIBUTE)).toBe(true);
    expect(styles.getQuiStylesHref()).toBe("/assets/qui.css");
  });

  it("adds configured array hrefs in order without duplicates", () => {
    const document = createFakeDocument();
    useDocument(document);
    const { host, root } = createHost(document);
    styles.setQuiStylesHref(["first.css", "second.css", "first.css"]);

    styles.ensureShadowStylesheet(host as unknown as HTMLElement);

    expect(linkHrefs(root)).toEqual(["first.css", "second.css"]);
    expect(styles.getQuiStylesHref()).toEqual(["first.css", "second.css"]);
  });

  it("does not add links to data-only roots", () => {
    const document = createFakeDocument();
    useDocument(document);
    const skipped = [
      createHost(document, "qui-option"),
      createHost(document, "qui-dialog"),
      createHost(document, "qui-field-helper-text"),
      createHost(document, "qui-field-error-text"),
      createHost(document, "qui-field-required-indicator"),
    ];
    styles.setQuiStylesHref("/assets/qui.css");

    for (const host of skipped) {
      styles.ensureShadowStylesheet(host.host as unknown as HTMLElement);
      expect(linkHrefs(host.root)).toEqual([]);
    }
  });

  it("does not duplicate links when called repeatedly", () => {
    const document = createFakeDocument();
    useDocument(document);
    const { host, root } = createHost(document);
    styles.setQuiStylesHref("/assets/qui.css");

    styles.ensureShadowStylesheet(host as unknown as HTMLElement);
    styles.ensureShadowStylesheet(host as unknown as HTMLElement);

    expect(linkHrefs(root)).toEqual(["/assets/qui.css"]);
  });

  it("discovers hrefs from document links when none are configured", () => {
    const document = createFakeDocument();
    useDocument(document);
    createDocumentLink(document, "discovered.css");
    const { host, root } = createHost(document);

    styles.ensureShadowStylesheet(host as unknown as HTMLElement);

    expect(linkHrefs(root)).toEqual(["discovered.css"]);
    expect(styles.getQuiStylesHref()).toBe("discovered.css");
  });

  it("caches document link discovery between components", () => {
    const document = createFakeDocument();
    useDocument(document);
    createDocumentLink(document, "discovered.css");
    const first = createHost(document);
    const second = createHost(document);
    const querySelectorAll = vi.spyOn(document, "querySelectorAll");

    styles.ensureShadowStylesheet(first.host as unknown as HTMLElement);
    styles.ensureShadowStylesheet(second.host as unknown as HTMLElement);

    expect(linkHrefs(first.root)).toEqual(["discovered.css"]);
    expect(linkHrefs(second.root)).toEqual(["discovered.css"]);
    expect(querySelectorAll).toHaveBeenCalledTimes(1);
  });
});

describe("setQuiStylesHref", () => {
  it("updates marked document links", () => {
    const document = createFakeDocument();
    useDocument(document);
    const documentLink = createDocumentLink(document, "old.css");

    styles.setQuiStylesHref("new.css");

    expect(documentLink.getAttribute("href")).toBe("new.css");
    expect(styles.getQuiStylesHref()).toBe("new.css");
  });

  it("updates links in existing qui shadow roots", () => {
    const document = createFakeDocument();
    useDocument(document);
    const { host, root } = createHost(document);

    styles.setQuiStylesHref("old.css");
    styles.ensureShadowStylesheet(host as unknown as HTMLElement);
    expect(linkHrefs(root)).toEqual(["old.css"]);

    styles.setQuiStylesHref("new.css");

    expect(linkHrefs(root)).toEqual(["new.css"]);
  });

  it("reconciles added and removed hrefs in existing roots", () => {
    const document = createFakeDocument();
    useDocument(document);
    const { host, root } = createHost(document);

    styles.setQuiStylesHref(["first.css", "second.css"]);
    styles.ensureShadowStylesheet(host as unknown as HTMLElement);
    expect(linkHrefs(root)).toEqual(["first.css", "second.css"]);

    styles.setQuiStylesHref("replacement.css");

    expect(linkHrefs(root)).toEqual(["replacement.css"]);
  });

  it("clears configuration and managed links on reset", () => {
    const document = createFakeDocument();
    useDocument(document);
    const { host, root } = createHost(document);
    styles.setQuiStylesHref("old.css");
    styles.ensureShadowStylesheet(host as unknown as HTMLElement);

    styles.resetQuiStylesHref();

    expect(linkHrefs(root)).toEqual([]);
    expect(styles.getQuiStylesHref()).toBeUndefined();
  });

  it("removes managed links when cleared", () => {
    const document = createFakeDocument();
    useDocument(document);
    createDocumentLink(document, "discovered.css");
    const { host, root } = createHost(document);

    styles.setQuiStylesHref("old.css");
    styles.ensureShadowStylesheet(host as unknown as HTMLElement);
    expect(linkHrefs(root)).toEqual(["old.css"]);

    styles.setQuiStylesHref([]);
    styles.ensureShadowStylesheet(host as unknown as HTMLElement);

    expect(linkHrefs(root)).toEqual([]);
    expect(styles.getQuiStylesHref()).toEqual([]);
    expect(document.querySelectorAll("link")).toEqual([]);
  });
});

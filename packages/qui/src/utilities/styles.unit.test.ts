import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  createFakeDocument,
  createHost,
  FakeNode,
  type FakeDocument,
  linkHrefs,
} from "../test-utils/fake-dom";

interface StylesModule {
  SHADOW_STYLES_MARKER: string;
  STYLESHEET_ATTRIBUTE: string;
  ensureShadowStylesheet: (host: HTMLElement) => void;
  getQuiStylesHref: () => string | string[] | undefined;
  setQuiStylesHref: (href: string | string[]) => void;
  resetQuiStylesHref: () => void;
}

let styles: StylesModule;

let MARKER_ATTRIBUTE = "";

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

class FakeMutationObserver {
  static instances: FakeMutationObserver[] = [];
  readonly observe = vi.fn();
  readonly disconnect = vi.fn();
  private readonly callback: (records: MutationRecord[]) => void;

  // oxlint-disable-next-line promise/prefer-await-to-callbacks -- MutationObserver is callback-based.
  constructor(callback: (records: MutationRecord[]) => void) {
    this.callback = callback;
    FakeMutationObserver.instances.push(this);
  }

  public trigger(records: MutationRecord[]): void {
    this.callback(records);
  }
}

function attributeRecord(target: FakeNode, attributeName: string): MutationRecord {
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- The mutation callback reads only these fields.
  return { type: "attributes", target, attributeName } as unknown as MutationRecord;
}

function childListRecord(added: FakeNode[], removed: FakeNode[]): MutationRecord {
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- The mutation callback reads only these fields.
  return {
    type: "childList",
    addedNodes: added,
    removedNodes: removed,
  } as unknown as MutationRecord;
}

beforeEach(async () => {
  vi.resetModules();
  styles = await import("./styles");
  MARKER_ATTRIBUTE = styles.STYLESHEET_ATTRIBUTE;
  FakeMutationObserver.instances = [];
});

afterEach(() => {
  vi.unstubAllGlobals();
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

  it("adds links to existing styled roots", () => {
    const document = createFakeDocument();
    useDocument(document);
    const { host, root } = createHost(document, "qui-card");
    root.append(document.createElement("div"));
    host.setAttribute(styles.SHADOW_STYLES_MARKER, "");

    styles.setQuiStylesHref("/assets/qui.css");

    expect(linkHrefs(root)).toEqual(["/assets/qui.css"]);
  });

  it("updates nested marked roots", () => {
    const document = createFakeDocument();
    useDocument(document);
    const outer = createHost(document, "qui-card");
    const inner = createHost(document, "qui-button");
    outer.root.append(inner.host);
    outer.host.setAttribute(styles.SHADOW_STYLES_MARKER, "");
    inner.host.setAttribute(styles.SHADOW_STYLES_MARKER, "");

    styles.setQuiStylesHref("/assets/qui.css");

    expect(linkHrefs(outer.root)).toEqual(["/assets/qui.css"]);
    expect(linkHrefs(inner.root)).toEqual(["/assets/qui.css"]);
  });

  it("does not add links to unmarked roots", () => {
    const document = createFakeDocument();
    useDocument(document);
    const skipped = [
      createHost(document, "qui-option"),
      createHost(document, "qui-dialog"),
      createHost(document, "qui-field-helper-text"),
      createHost(document, "qui-field-error-text"),
      createHost(document, "qui-field-required-indicator"),
    ];
    for (const host of skipped) {
      host.root.append(document.createElement("slot"));
    }

    styles.setQuiStylesHref("/assets/qui.css");

    for (const host of skipped) {
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
});

describe("document discovery", () => {
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

  it("ignores unmarked link mutations when invalidating discovery", () => {
    const document = createFakeDocument();
    useDocument(document);
    const marked = createDocumentLink(document, "first.css");
    const unmarked = document.createElement("link");
    unmarked.setAttribute("href", "unmanaged.css");
    vi.stubGlobal("MutationObserver", FakeMutationObserver);
    vi.stubGlobal("Element", FakeNode);

    expect(styles.getQuiStylesHref()).toBe("first.css");
    const observer = FakeMutationObserver.instances.at(-1);
    if (!observer) {
      throw new Error("Expected the discovery observer to be installed");
    }

    marked.setAttribute("href", "second.css");
    observer.trigger([attributeRecord(unmarked, "href")]);
    expect(styles.getQuiStylesHref()).toBe("first.css");

    observer.trigger([attributeRecord(marked, "href")]);
    expect(styles.getQuiStylesHref()).toBe("second.css");
  });

  it("invalidates discovery when a marked link is added", () => {
    const document = createFakeDocument();
    useDocument(document);
    createDocumentLink(document, "first.css");
    vi.stubGlobal("MutationObserver", FakeMutationObserver);
    vi.stubGlobal("Element", FakeNode);

    expect(styles.getQuiStylesHref()).toBe("first.css");
    const observer = FakeMutationObserver.instances.at(-1);
    if (!observer) {
      throw new Error("Expected the discovery observer to be installed");
    }

    const unmarked = document.createElement("link");
    observer.trigger([childListRecord([unmarked], [])]);
    expect(styles.getQuiStylesHref()).toBe("first.css");

    const added = createDocumentLink(document, "second.css");
    observer.trigger([childListRecord([added], [])]);
    expect(styles.getQuiStylesHref()).toEqual(["first.css", "second.css"]);
  });

  it("invalidates discovery when the marker is removed", () => {
    const document = createFakeDocument();
    useDocument(document);
    const marked = createDocumentLink(document, "first.css");
    vi.stubGlobal("MutationObserver", FakeMutationObserver);
    vi.stubGlobal("Element", FakeNode);

    expect(styles.getQuiStylesHref()).toBe("first.css");
    const observer = FakeMutationObserver.instances.at(-1);
    if (!observer) {
      throw new Error("Expected the discovery observer to be installed");
    }

    marked.removeAttribute(MARKER_ATTRIBUTE);
    observer.trigger([attributeRecord(marked, MARKER_ATTRIBUTE)]);
    expect(styles.getQuiStylesHref()).toBeUndefined();
  });

  it("invalidates discovery when the marker is added", () => {
    const document = createFakeDocument();
    useDocument(document);
    const link = document.createElement("link");
    link.setAttribute("href", "added.css");
    document.append(link);
    vi.stubGlobal("MutationObserver", FakeMutationObserver);
    vi.stubGlobal("Element", FakeNode);

    expect(styles.getQuiStylesHref()).toBeUndefined();
    const observer = FakeMutationObserver.instances.at(-1);
    if (!observer) {
      throw new Error("Expected the discovery observer to be installed");
    }

    link.setAttribute(MARKER_ATTRIBUTE, "");
    observer.trigger([attributeRecord(link, MARKER_ATTRIBUTE)]);
    expect(styles.getQuiStylesHref()).toBe("added.css");
  });

  it("conservatively invalidates discovery when an unmarked link is removed", () => {
    const document = createFakeDocument();
    useDocument(document);
    const marked = createDocumentLink(document, "first.css");
    const unmarked = document.createElement("link");
    document.append(unmarked);
    vi.stubGlobal("MutationObserver", FakeMutationObserver);
    vi.stubGlobal("Element", FakeNode);

    expect(styles.getQuiStylesHref()).toBe("first.css");
    const observer = FakeMutationObserver.instances.at(-1);
    if (!observer) {
      throw new Error("Expected the discovery observer to be installed");
    }

    marked.setAttribute("href", "second.css");
    unmarked.remove();
    observer.trigger([childListRecord([], [unmarked])]);
    expect(styles.getQuiStylesHref()).toBe("second.css");
  });

  it("invalidates discovery when a marked link is removed", () => {
    const document = createFakeDocument();
    useDocument(document);
    createDocumentLink(document, "first.css");
    const removed = createDocumentLink(document, "second.css");
    vi.stubGlobal("MutationObserver", FakeMutationObserver);
    vi.stubGlobal("Element", FakeNode);

    expect(styles.getQuiStylesHref()).toEqual(["first.css", "second.css"]);
    const observer = FakeMutationObserver.instances.at(-1);
    if (!observer) {
      throw new Error("Expected the discovery observer to be installed");
    }

    removed.remove();
    observer.trigger([childListRecord([], [removed])]);
    expect(styles.getQuiStylesHref()).toBe("first.css");
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

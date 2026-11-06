import { describe, expect, it } from "vitest";

import {
  createFakeDocument,
  createHost,
  type FakeNode,
  linkHrefs,
} from "../../../tests/test-utils/fake-dom";
import { SHADOW_STYLES_MARKER, STYLESHEET_ATTRIBUTE } from "../styles";
import {
  injectDocumentStylesheet,
  injectShadowStylesheet,
  withShadowStylesheet,
  type HydrateRenderOptions,
} from "./index";

function markStyled(host: FakeNode): void {
  host.setAttribute(SHADOW_STYLES_MARKER, "");
}

function createMeta(
  document: ReturnType<typeof createFakeDocument>,
  name: string,
  content: string,
) {
  const meta = document.createElement("meta");
  meta.setAttribute("name", name);
  meta.setAttribute("content", content);
  document.head.append(meta);
  return meta;
}

function createLink(
  document: ReturnType<typeof createFakeDocument>,
  attributes: Record<string, string>,
): FakeNode {
  const link = document.createElement("link");
  for (const [name, value] of Object.entries(attributes)) {
    link.setAttribute(name, value);
  }
  document.head.append(link);
  return link;
}

describe("injectShadowStylesheet", () => {
  it("visits nested shadow roots", () => {
    const document = createFakeDocument();
    const outer = createHost(document, "qui-card");
    const inner = createHost(document, "qui-button");
    outer.root.append(document.createElement("div"), inner.host);
    inner.root.append(document.createElement("div"));
    markStyled(outer.host);
    markStyled(inner.host);

    injectShadowStylesheet(document as unknown as Document, { href: "components.css" });

    expect(linkHrefs(outer.root)).toEqual(["components.css"]);
    expect(linkHrefs(inner.root)).toEqual(["components.css"]);
  });

  it("only injects into marked hosts", () => {
    const document = createFakeDocument();
    const qui = createHost(document, "qui-card");
    const other = createHost(document, "other-card");
    qui.root.append(document.createElement("div"));
    other.root.append(document.createElement("div"));
    markStyled(qui.host);

    injectShadowStylesheet(document as unknown as Document, { href: "components.css" });

    expect(linkHrefs(qui.root)).toEqual(["components.css"]);
    expect(linkHrefs(other.root)).toEqual([]);
  });

  it("skips data-only host roots by default", () => {
    const document = createFakeDocument();
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
    const button = createHost(document, "qui-button");
    button.root.append(document.createElement("div"));
    markStyled(button.host);

    injectShadowStylesheet(document as unknown as Document, { href: "components.css" });

    for (const host of skipped) {
      expect(linkHrefs(host.root)).toEqual([]);
    }
    expect(linkHrefs(button.root)).toEqual(["components.css"]);
  });

  it("does not add links to large option lists", () => {
    const document = createFakeDocument();
    const select = createHost(document, "qui-select");
    select.root.append(document.createElement("div"));
    markStyled(select.host);
    const options = Array.from({ length: 1000 }, () => createHost(document, "qui-option"));
    for (const option of options) {
      option.root.append(document.createElement("slot"));
    }

    injectShadowStylesheet(document as unknown as Document, { href: "components.css" });

    expect(linkHrefs(select.root)).toEqual(["components.css"]);
    expect(options.every((option) => linkHrefs(option.root).length === 0)).toBe(true);
  });

  it("uses the component marker for slot-only styled roots", () => {
    const document = createFakeDocument();
    const { host, root } = createHost(document, "qui-card");
    root.append(document.createElement("slot"));
    markStyled(host);

    injectShadowStylesheet(document as unknown as Document, { href: "components.css" });

    expect(linkHrefs(root)).toEqual(["components.css"]);
  });

  it("does not duplicate an existing marked link", () => {
    const document = createFakeDocument();
    const { host, root } = createHost(document, "qui-card");
    root.append(document.createElement("div"));
    markStyled(host);
    const options = { href: "components.css" };

    injectShadowStylesheet(document as unknown as Document, options);
    injectShadowStylesheet(document as unknown as Document, options);

    expect(linkHrefs(root)).toEqual(["components.css"]);
  });

  it("ignores empty hrefs", () => {
    const document = createFakeDocument();
    const { host, root } = createHost(document, "qui-card");
    markStyled(host);

    injectShadowStylesheet(document as unknown as Document, { href: "" });

    expect(linkHrefs(root)).toEqual([]);
  });

  it("inserts multiple hrefs as the first children in order", () => {
    const document = createFakeDocument();
    const { host, root } = createHost(document, "qui-card");
    root.append(document.createElement("span"));
    markStyled(host);

    injectShadowStylesheet(document as unknown as Document, {
      href: ["first.css", "second.css"],
    });

    expect(root.children.map((child) => child.tagName)).toEqual(["LINK", "LINK", "SPAN"]);
    expect(linkHrefs(root)).toEqual(["first.css", "second.css"]);
  });

  it("applies the explicit nonce to inserted links", () => {
    const document = createFakeDocument();
    const { host, root } = createHost(document, "qui-card");
    markStyled(host);

    injectShadowStylesheet(document as unknown as Document, {
      href: "components.css",
      nonce: "shadow-nonce",
    });

    expect(root.children[0]?.getAttribute("nonce")).toBe("shadow-nonce");
  });

  it("uses the document CSP nonce when none is provided", () => {
    const document = createFakeDocument();
    const { host, root } = createHost(document, "qui-card");
    markStyled(host);
    createMeta(document, "csp-nonce", "meta-nonce");

    injectShadowStylesheet(document as unknown as Document, { href: "components.css" });

    expect(root.children[0]?.getAttribute("nonce")).toBe("meta-nonce");
  });
});

describe("injectDocumentStylesheet", () => {
  it("adds a marked document stylesheet link", () => {
    const document = createFakeDocument();

    injectDocumentStylesheet(document as unknown as Document, { href: "components.css" });

    expect(linkHrefs(document.head)).toEqual(["components.css"]);
    expect(document.head.children[0]?.getAttribute(STYLESHEET_ATTRIBUTE)).toBe("");
  });

  it("marks an existing matching stylesheet link instead of duplicating it", () => {
    const document = createFakeDocument();
    createLink(document, { rel: "stylesheet", href: "components.css" });

    injectDocumentStylesheet(document as unknown as Document, { href: "components.css" });

    expect(linkHrefs(document.head)).toEqual(["components.css"]);
    expect(document.head.children[0]?.getAttribute(STYLESHEET_ATTRIBUTE)).toBe("");
  });

  it("reconciles managed links to the configured hrefs", () => {
    const document = createFakeDocument();
    createLink(document, {
      rel: "stylesheet",
      href: "old.css",
      [STYLESHEET_ATTRIBUTE]: "",
    });
    createLink(document, {
      rel: "stylesheet",
      href: "surplus.css",
      [STYLESHEET_ATTRIBUTE]: "",
    });

    injectDocumentStylesheet(document as unknown as Document, {
      href: ["first.css", "second.css"],
    });

    expect(linkHrefs(document.head)).toEqual(["first.css", "second.css"]);
  });

  it("keeps configured order when managed hrefs are reordered", () => {
    const document = createFakeDocument();
    createLink(document, { rel: "stylesheet", href: "first.css", [STYLESHEET_ATTRIBUTE]: "" });
    createLink(document, { rel: "stylesheet", href: "second.css", [STYLESHEET_ATTRIBUTE]: "" });

    injectDocumentStylesheet(document as unknown as Document, {
      href: ["second.css", "first.css"],
    });

    expect(linkHrefs(document.head)).toEqual(["second.css", "first.css"]);
  });

  it("does not reuse a managed link reserved for a later href", () => {
    const document = createFakeDocument();
    createLink(document, { rel: "stylesheet", href: "first.css", [STYLESHEET_ATTRIBUTE]: "" });

    injectDocumentStylesheet(document as unknown as Document, {
      href: ["second.css", "first.css"],
    });

    expect(linkHrefs(document.head)).toEqual(["second.css", "first.css"]);
  });

  it("applies the resolved nonce to existing and new links", () => {
    const document = createFakeDocument();
    createLink(document, { rel: "stylesheet", href: "first.css" });
    createMeta(document, "csp-nonce", "meta-nonce");

    injectDocumentStylesheet(document as unknown as Document, {
      href: ["first.css", "second.css"],
    });

    expect(
      document.head.children
        .filter((child) => child.tagName === "LINK")
        .map((child) => child.getAttribute("nonce")),
    ).toEqual(["meta-nonce", "meta-nonce"]);
  });
});

describe("withShadowStylesheet", () => {
  it("preserves the caller's afterHydrate", () => {
    const document = createFakeDocument();
    const calls: string[] = [];

    const options = withShadowStylesheet(
      { href: "components.css" },
      {
        prettyHtml: true,
        afterHydrate(hydrated: Document) {
          calls.push("caller");
          expect(hydrated).toBe(document);
        },
      },
    );

    options.afterHydrate?.(document as unknown as Document);

    expect(calls).toEqual(["caller"]);
    expect(options.prettyHtml).toBe(true);
  });

  it("adds the document link before running the caller's beforeHydrate", () => {
    const document = createFakeDocument();
    const calls: string[] = [];

    const options = withShadowStylesheet(
      { href: "components.css" },
      {
        beforeHydrate(hydrated: Document) {
          calls.push("caller");
          expect(linkHrefs(document.head)).toEqual(["components.css"]);
          expect(hydrated).toBe(document);
        },
      },
    );

    options.beforeHydrate?.(document as unknown as Document);

    expect(calls).toEqual(["caller"]);
    expect(document.head.children[0]?.getAttribute(STYLESHEET_ATTRIBUTE)).toBe("");
  });

  it("rejects unsupported shadow root serialization modes", () => {
    const renderOptions = {
      serializeShadowRoot: "scoped",
    } as unknown as HydrateRenderOptions;

    expect(() => withShadowStylesheet({ href: "components.css" }, renderOptions)).toThrow(
      /declarative shadow DOM/u,
    );
  });
});

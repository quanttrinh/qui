import { describe, expect, it } from "vitest";

import { createFakeDocument, createHost, linkHrefs } from "../test-utils/fake-dom";
import { injectShadowStylesheet, withShadowStylesheet } from "./ssr";

describe("injectShadowStylesheet", () => {
  it("visits nested shadow roots", () => {
    const document = createFakeDocument();
    const outer = createHost(document, "qui-card");
    const inner = createHost(document, "qui-button");
    outer.root.append(document.createElement("div"), inner.host);
    inner.root.append(document.createElement("div"));

    injectShadowStylesheet(document as unknown as Document, { href: "theme.css" });

    expect(linkHrefs(outer.root)).toEqual(["theme.css"]);
    expect(linkHrefs(inner.root)).toEqual(["theme.css"]);
  });

  it("only injects into hosts matching the tag prefix", () => {
    const document = createFakeDocument();
    const qui = createHost(document, "qui-card");
    const other = createHost(document, "other-card");
    qui.root.append(document.createElement("div"));
    other.root.append(document.createElement("div"));

    injectShadowStylesheet(document as unknown as Document, { href: "theme.css" });

    expect(linkHrefs(qui.root)).toEqual(["theme.css"]);
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

    injectShadowStylesheet(document as unknown as Document, { href: "theme.css" });

    for (const host of skipped) {
      expect(linkHrefs(host.root)).toEqual([]);
    }
    expect(linkHrefs(button.root)).toEqual(["theme.css"]);
  });

  it("does not add links to large option lists", () => {
    const document = createFakeDocument();
    const select = createHost(document, "qui-select");
    select.root.append(document.createElement("div"));
    const options = Array.from({ length: 1000 }, () => createHost(document, "qui-option"));
    for (const option of options) {
      option.root.append(document.createElement("slot"));
    }

    injectShadowStylesheet(document as unknown as Document, { href: "theme.css" });

    expect(linkHrefs(select.root)).toEqual(["theme.css"]);
    expect(options.every((option) => linkHrefs(option.root).length === 0)).toBe(true);
  });

  it("does not duplicate an existing marked link", () => {
    const document = createFakeDocument();
    const { root } = createHost(document, "qui-card");
    root.append(document.createElement("div"));
    const options = { href: "theme.css" };

    injectShadowStylesheet(document as unknown as Document, options);
    injectShadowStylesheet(document as unknown as Document, options);

    expect(linkHrefs(root)).toEqual(["theme.css"]);
  });

  it("inserts multiple hrefs as the first children in order", () => {
    const document = createFakeDocument();
    const { root } = createHost(document, "qui-card");
    root.append(document.createElement("span"));

    injectShadowStylesheet(document as unknown as Document, {
      href: ["first.css", "second.css"],
    });

    expect(root.children.map((child) => child.tagName)).toEqual(["LINK", "LINK", "SPAN"]);
    expect(linkHrefs(root)).toEqual(["first.css", "second.css"]);
  });
});

describe("withShadowStylesheet", () => {
  it("injects before running the caller's afterHydrate", () => {
    const document = createFakeDocument();
    const { root } = createHost(document, "qui-card");
    root.append(document.createElement("div"));
    const calls: string[] = [];

    const options = withShadowStylesheet(
      { href: "theme.css" },
      {
        prettyHtml: true,
        afterHydrate(hydrated: Document) {
          calls.push("caller");
          expect(linkHrefs(root)).toEqual(["theme.css"]);
          expect(hydrated).toBe(document);
        },
      },
    );

    options.afterHydrate?.(document as unknown as Document);

    expect(calls).toEqual(["caller"]);
    expect(options.prettyHtml).toBe(true);
  });
});

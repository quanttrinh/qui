import { describe, expect, it } from "vitest";

import { createFakeDocument, createHost, linkHrefs } from "../test-utils/fake-dom";
import { injectShadowStylesheet, withShadowStylesheet } from "./ssr";

describe("injectShadowStylesheet", () => {
  it("visits nested shadow roots", () => {
    const document = createFakeDocument();
    const outer = createHost(document, "qui-card");
    const inner = createHost(document, "qui-button");
    outer.root.append(inner.host);

    injectShadowStylesheet(document as unknown as Document, { href: "theme.css" });

    expect(linkHrefs(outer.root)).toEqual(["theme.css"]);
    expect(linkHrefs(inner.root)).toEqual(["theme.css"]);
  });

  it("only injects into hosts matching the tag prefix", () => {
    const document = createFakeDocument();
    const qui = createHost(document, "qui-card");
    const other = createHost(document, "other-card");

    injectShadowStylesheet(document as unknown as Document, { href: "theme.css" });

    expect(linkHrefs(qui.root)).toEqual(["theme.css"]);
    expect(linkHrefs(other.root)).toEqual([]);
  });

  it("does not duplicate an existing marked link", () => {
    const document = createFakeDocument();
    const { root } = createHost(document, "qui-card");
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

import { describe, expect, it } from "vitest";

import {
  componentsFromVirtualModuleId,
  createExternalStylesModule,
  createRegistrationModule,
  createStylesModule,
  extractComponents,
  importInjectionOffset,
  isExternalStyles,
  isTransformableId,
  markStylesheetLinks,
  normalizeComponents,
  virtualModuleId,
  type QuiStylesOptions,
} from "./core";

describe("extractComponents", () => {
  it("finds opening component tags, ignores closing tags, and deduplicates", () => {
    const code = `
      export const Form = () => (
        <qui-field>
          <qui-input name="email" />
          <qui-button variant="filled">Save</qui-button>
          <qui-button variant="text">Cancel</qui-button>
        </qui-field>
      );
    `;

    expect(extractComponents(code, "/app/Form.tsx")).toEqual([
      "qui-button",
      "qui-field",
      "qui-input",
    ]);
  });

  it("ignores tags inside strings and comments", () => {
    const code = `
      const example = "<qui-button>";
      // <qui-input>
      export const Form = () => <qui-card />;
    `;

    expect(extractComponents(code, "/app/Form.tsx")).toEqual(["qui-card"]);
  });

  it("finds component calls", () => {
    const code = `
      h("qui-button", null);
      React.createElement("qui-input");
      jsx("div", null);
    `;

    expect(extractComponents(code, "/app/render.ts")).toEqual(["qui-button", "qui-input"]);
  });

  it("uses lexical extraction for Astro and MDX", () => {
    const astro = '$$render`<qui-select><qui-option value="a">A</qui-option></qui-select>`;';
    const mdx = "# Example\n\n<qui-button>Save</qui-button>";

    expect(extractComponents(astro, "/app/page.astro")).toEqual(["qui-option", "qui-select"]);
    expect(extractComponents(mdx, "/app/page.mdx")).toEqual(["qui-button"]);
  });

  it("ignores unterminated tags in malformed source", () => {
    expect(extractComponents("export const x = <qui-button", "/app/broken.tsx")).toEqual([]);
  });

  it("skips source that cannot contain a component tag", () => {
    expect(extractComponents("export const value = 1;", "/app/value.ts")).toEqual([]);
  });

  it("drops malformed component tags", () => {
    expect(extractComponents("const value = <qui- />;", "/app/value.tsx")).toEqual([]);
  });

  it("resolves escaped static tag names", () => {
    const stringTag = String.raw`h("qui\u002Dbutton");`;
    const templateTag = ["h(`", String.raw`\u0071ui-button`, "`);"].join("");

    expect(extractComponents(stringTag, "/app/render.ts")).toEqual(["qui-button"]);
    expect(extractComponents(templateTag, "/app/render.ts")).toEqual(["qui-button"]);
  });

  it("walks deeply nested and wide JSX trees", () => {
    const depth = 2000;
    const deep = `const view = ${"<div>".repeat(depth)}<qui-button />${"</div>".repeat(depth)};`;
    const wide = `const view = <div>${"<qui-card />".repeat(5000)}</div>;`;

    expect(extractComponents(deep, "/app/deep.tsx")).toEqual(["qui-button"]);
    expect(extractComponents(wide, "/app/wide.tsx")).toEqual(["qui-card"]);
  });
});

function* singleUseComponents(): Generator<string> {
  yield "qui-accordion-content";
  yield "qui-accordion";
}

describe("registration order", () => {
  const DEFINITION_PATTERN =
    /defineCustomElement as __qui_\d+\s+\} from "@quanttrinh\/qui\/shared\/(?<tag>qui-[^"]+)"/gu;
  const IMPORT_PATTERN = /from "@quanttrinh\/qui\/shared\/(?<tag>qui-[^"]+)"/gu;

  it("sorts normalized components alphabetically", () => {
    expect(
      normalizeComponents([
        "qui-accordion-content",
        "qui-accordion-trigger",
        "qui-accordion-item",
        "qui-accordion",
      ]),
    ).toEqual([
      "qui-accordion",
      "qui-accordion-content",
      "qui-accordion-item",
      "qui-accordion-trigger",
    ]);
  });

  it("emits definitions in sorted order", () => {
    const code = createRegistrationModule(
      ["qui-accordion-content", "qui-accordion-trigger", "qui-accordion", "qui-accordion-item"],
      { styles: false },
    );
    const definitions = [...code.matchAll(DEFINITION_PATTERN)].map((match) => match.groups?.tag);

    expect(definitions).toEqual([
      "qui-accordion",
      "qui-accordion-content",
      "qui-accordion-item",
      "qui-accordion-trigger",
    ]);
  });

  it("consumes one-shot component iterables once", () => {
    const code = createRegistrationModule(singleUseComponents(), { styles: false });
    const definitions = [...code.matchAll(IMPORT_PATTERN)].map((match) => match.groups?.tag);

    expect(definitions).toEqual(["qui-accordion", "qui-accordion-content"]);
  });
});

describe("virtual registration module", () => {
  it("round-trips component names through the virtual module id", () => {
    const id = virtualModuleId(["qui-input", "qui-button", "qui-button"]);

    expect(componentsFromVirtualModuleId(id)).toEqual(["qui-button", "qui-input"]);
  });

  it("emits shared registration and shared styles", () => {
    const code = createRegistrationModule(["qui-button"]);

    expect(code).toContain('from "@quanttrinh/qui/register"');
    expect(code).toContain('from "@quanttrinh/qui/shared/qui-button"');
    expect(code).toContain('import "virtual:qui/styles";');
    expect(code).toContain("defineComponents(__qui_0);");
  });

  it("can omit styles", () => {
    const code = createRegistrationModule(["qui-button"], { styles: false });

    expect(code).not.toContain("virtual:qui/styles");
  });

  it("returns an empty module when there are no components", () => {
    expect(createRegistrationModule([])).toBe("");
  });
});

describe("virtual styles module", () => {
  it("configures a document and shadow-root URL only when none exists", () => {
    const code = createStylesModule(":host { display: block; }");

    expect(code).toContain('import "@quanttrinh/qui/theme.css";');
    expect(code).toContain('from "@quanttrinh/qui/runtime"');
    expect(code).toContain('":host { display: block; }"');
    expect(code).toContain("URL.createObjectURL");
    expect(code).toContain('link.setAttribute("data-qui-styles", "");');
    expect(code).toContain("getQuiStylesHref() === undefined");
    expect(code).toContain("setQuiStylesHref(url);");
    expect(code).toContain("resetQuiStylesHref();");
  });

  it("can keep the theme out of the inline module", () => {
    const code = createStylesModule(":host { display: block; }", { theme: false });

    expect(code).not.toContain("@quanttrinh/qui/theme.css");
    expect(code).toContain("URL.createObjectURL");
  });

  it("does not import theme when styles are disabled", () => {
    const code = createStylesModule(":host { display: block; }", false);

    expect(code).not.toContain("@quanttrinh/qui/theme.css");
  });

  it("uses an external component stylesheet without runtime fallback", () => {
    const code = createExternalStylesModule({ href: "/assets/app.css" });

    expect(code).not.toContain("@quanttrinh/qui/theme.css");
    expect(code).not.toContain("@quanttrinh/qui/runtime");
    expect(code).not.toContain("URL.createObjectURL");
    expect(code).not.toContain("createElement");
    expect(code).not.toContain("setQuiStylesHref");
    expect(code).not.toContain("getQuiStylesHref");
    expect(code).not.toContain("resetQuiStylesHref");
  });

  it("imports the theme for external styles when requested", () => {
    const code = createExternalStylesModule({
      href: ["/assets/app.css", "/assets/overrides.css"],
      theme: true,
    });

    expect(code).toContain('import "@quanttrinh/qui/theme.css";');
  });

  it("keeps the theme out of external styles unless requested", () => {
    const code = createExternalStylesModule({
      href: "/assets/app.css",
      theme: false,
    });

    expect(code).not.toContain("@quanttrinh/qui/theme.css");
  });

  it("emits an empty module for an empty external stylesheet list", () => {
    expect(createExternalStylesModule({ href: [] })).toBe("");
  });

  it("validates external href values", () => {
    expect(isExternalStyles({ href: "/app.css" })).toBe(true);
    expect(isExternalStyles({ href: ["/app.css"] })).toBe(true);
    expect(isExternalStyles({ href: [1] } as unknown as QuiStylesOptions)).toBe(false);
  });
});

describe("markStylesheetLinks", () => {
  const MARKER = /data-qui-styles/gu;
  const html = [
    "<html><head>",
    '<link rel="stylesheet" href="/assets/theme.css">',
    '<link rel="stylesheet" href="/assets/app.css">',
    '<link rel="stylesheet" href="/assets/other.css">',
    "</head></html>",
  ].join("");

  it("marks only matching stylesheet links", () => {
    const marked = markStylesheetLinks(html, "/assets/app.css");

    expect(marked).toContain('<link rel="stylesheet" href="/assets/app.css" data-qui-styles>');
    expect(marked).toContain('<link rel="stylesheet" href="/assets/theme.css">');
    expect(marked).toContain('<link rel="stylesheet" href="/assets/other.css">');
  });

  it("marks an ordered list of hrefs", () => {
    const marked = markStylesheetLinks(html, ["/assets/app.css", "/assets/other.css"]);

    expect(marked.match(MARKER)).toHaveLength(2);
    expect(marked).toContain('href="/assets/app.css" data-qui-styles>');
    expect(marked).toContain('href="/assets/other.css" data-qui-styles>');
  });

  it("preserves existing markers and self-closing tags", () => {
    const marked = markStylesheetLinks(
      '<link rel="stylesheet" href="/a.css" data-qui-styles /><link rel="stylesheet" href="/a.css" />',
      "/a.css",
    );

    expect(marked.match(MARKER)).toHaveLength(2);
    expect(marked).toContain('href="/a.css" data-qui-styles />');
  });

  it("does not mark non-stylesheet links or attribute lookalikes", () => {
    const marked = markStylesheetLinks(
      ['<link rel="preload" href="/app.css">', '<link rel="stylesheet" data-href="/app.css">'].join(
        "",
      ),
      "/app.css",
    );

    expect(marked).not.toMatch(MARKER);
  });

  it("does not treat a longer marker attribute as an existing marker", () => {
    const marked = markStylesheetLinks(
      '<link rel="stylesheet" href="/app.css" data-qui-styles-extra>',
      "/app.css",
    );

    expect(marked).toContain("data-qui-styles-extra data-qui-styles");
  });

  it("does not guess hashed or alternate stylesheet URLs", () => {
    const marked = markStylesheetLinks(
      [
        '<link rel="stylesheet" href="/assets/app-a1b2c3.css">',
        '<link rel="alternate stylesheet" href="/app.css">',
      ].join(""),
      "/assets/app.css",
    );

    expect(marked).not.toMatch(MARKER);
    expect(marked).not.toContain('href="/app.css" data-qui-styles');
  });

  it("supports unquoted attribute values", () => {
    const marked = markStylesheetLinks("<link rel=stylesheet href=/app.css>", "/app.css");

    expect(marked).toBe("<link rel=stylesheet href=/app.css data-qui-styles>");
  });

  it("handles quoted greater-than signs and multiline attributes", () => {
    const source = [
      "<link",
      '  rel="stylesheet"',
      '  href="/app.css"',
      '  data-note="a > b"',
      ">",
    ].join("\n");

    const marked = markStylesheetLinks(source, "/app.css");

    expect(marked).toContain('data-note="a > b"');
    expect(marked).toContain("data-qui-styles>");
    expect(marked).not.toContain('data-note="a "');
  });

  it("does nothing for an empty href list", () => {
    expect(markStylesheetLinks(html, [])).toBe(html);
  });

  it("deduplicates hrefs and ignores empty entries", () => {
    const marked = markStylesheetLinks(
      '<link rel="stylesheet" href="/app.css"><link rel="stylesheet" href="/app.css">',
      ["/app.css", "/app.css", ""],
    );

    expect(marked.match(MARKER)).toHaveLength(2);
  });

  it("does not rewrite link-like text inside scripts, styles, or comments", () => {
    const source = [
      '<script>const t = \'<link rel="stylesheet" href="/app.css">\';</script>',
      '<style>/* <link rel="stylesheet" href="/app.css"> */</style>',
      '<!-- <link rel="stylesheet" href="/app.css"> -->',
      '<template><link rel="stylesheet" href="/app.css"></template>',
      '<textarea><link rel="stylesheet" href="/app.css"></textarea>',
      '<link rel="stylesheet" href="/app.css">',
    ].join("");

    const marked = markStylesheetLinks(source, "/app.css");

    expect(marked.match(MARKER)).toHaveLength(1);
    expect(marked.endsWith('<link rel="stylesheet" href="/app.css" data-qui-styles>')).toBe(true);
  });
});

describe("importInjectionOffset", () => {
  it("inserts after MDX frontmatter", () => {
    const code = "---\ntitle: Example\n---\n<qui-button />";
    expect(code.slice(importInjectionOffset(code))).toBe("<qui-button />");
  });

  it("handles empty and CRLF frontmatter", () => {
    const empty = "---\n---\n<qui-button />";
    const crlf = "---\r\ntitle: Example\r\n---\r\n<qui-button />";

    expect(empty.slice(importInjectionOffset(empty))).toBe("<qui-button />");
    expect(crlf.slice(importInjectionOffset(crlf))).toBe("<qui-button />");
  });

  it("handles frontmatter ending at EOF and trailing fence whitespace", () => {
    const eof = "---\n---";
    const crlfEof = "---\r\n---";
    const trailing = "---\ntitle: Example\n---   \n<qui-button />";

    expect(importInjectionOffset(eof)).toBe(eof.length);
    expect(importInjectionOffset(crlfEof)).toBe(crlfEof.length);
    expect(trailing.slice(importInjectionOffset(trailing))).toBe("<qui-button />");
  });

  it("uses the start when there is no frontmatter", () => {
    expect(importInjectionOffset("export const value = 1;")).toBe(0);
  });
});

describe("isTransformableId", () => {
  it("accepts JavaScript, TypeScript, JSX, and MDX", () => {
    expect(isTransformableId("/app/src/page.tsx")).toBe(true);
    expect(isTransformableId("/app/src/page.astro")).toBe(false);
    expect(isTransformableId("/app/src/page.mdx")).toBe(true);
    expect(isTransformableId("/app/src/page.mjs")).toBe(true);
  });

  it("rejects virtual modules, node_modules, and unrelated files", () => {
    expect(isTransformableId("\0virtual:qui/register")).toBe(false);
    expect(isTransformableId("virtual:qui/register")).toBe(false);
    expect(isTransformableId("/app/node_modules/pkg/page.tsx")).toBe(false);
    expect(isTransformableId("/app/src/page.css")).toBe(false);
  });
});

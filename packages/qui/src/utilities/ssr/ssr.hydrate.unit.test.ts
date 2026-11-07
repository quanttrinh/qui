import { beforeAll, describe, expect, it } from "vitest";

import { loadHydrate } from "../../../tests/test-utils/hydrate";
import { createConfig } from "../../../tooling/config";
import { undefinedContentTagsFromSource } from "../../../tooling/panda/undefined-content-scan";
import { resetQuiStylesHref, setQuiStylesHref } from "../styles";
import { withShadowStylesheet } from "./index";

const build = createConfig(process.cwd());
let UNDEFINED_CONTENT_TAGS: string[] = [];

beforeAll(async () => {
  UNDEFINED_CONTENT_TAGS = await undefinedContentTagsFromSource(build);
});

const SHADOW_LINK = /<link[^>]*data-qui-styles[^>]*>/gu;
const INLINE_STYLE = /<style[^>]*>[^<]*\.d_inline-block/u;
const HEAD_STYLESHEET = /<head[\s\S]*?<link[^>]*data-qui-styles[^>]*>/u;

const ALL_COMPONENTS = `
  <qui-accordion>
    <qui-accordion-item value="a">
      <qui-accordion-trigger>A</qui-accordion-trigger>
      <qui-accordion-content>Body</qui-accordion-content>
    </qui-accordion-item>
  </qui-accordion>
  <qui-button>Save</qui-button>
  <qui-card>
    <span slot="title">Title</span>
    <span slot="description">Description</span>
    Content
  </qui-card>
  <qui-checkbox>Check</qui-checkbox>
  <qui-combobox></qui-combobox>
  <qui-dialog>
    <qui-dialog-trigger>Open</qui-dialog-trigger>
    <qui-dialog-content>
      <qui-dialog-title>Title</qui-dialog-title>
      <qui-dialog-description>Description</qui-dialog-description>
      <qui-dialog-close>Close</qui-dialog-close>
      <qui-dialog-actions>Actions</qui-dialog-actions>
    </qui-dialog-content>
  </qui-dialog>
  <qui-field id="field">
    <qui-field-label>Label</qui-field-label>
    <qui-field-required-indicator>*</qui-field-required-indicator>
    <qui-input></qui-input>
    <qui-field-helper-text>Help</qui-field-helper-text>
    <qui-field-error-text>Error</qui-field-error-text>
  </qui-field>
  <qui-icon label="Add" path="M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6V5z"></qui-icon>
  <qui-popover>Popover</qui-popover>
  <qui-radio-group>
    <qui-radio value="a">A</qui-radio>
  </qui-radio-group>
  <qui-select>
    <qui-option value="a">A</qui-option>
  </qui-select>
  <qui-switch>Switch</qui-switch>
  <qui-tabs>
    <qui-tab-list>
      <qui-tab-trigger value="a">A</qui-tab-trigger>
    </qui-tab-list>
    <qui-tab-panel value="a">Panel</qui-tab-panel>
  </qui-tabs>
  <qui-textarea></qui-textarea>
`;

const ALL_COMPONENT_TAGS = [
  "qui-accordion",
  "qui-accordion-content",
  "qui-accordion-item",
  "qui-accordion-trigger",
  "qui-button",
  "qui-card",
  "qui-checkbox",
  "qui-combobox",
  "qui-dialog",
  "qui-dialog-actions",
  "qui-dialog-close",
  "qui-dialog-content",
  "qui-dialog-description",
  "qui-dialog-title",
  "qui-dialog-trigger",
  "qui-field",
  "qui-field-error-text",
  "qui-field-helper-text",
  "qui-field-label",
  "qui-field-required-indicator",
  "qui-icon",
  "qui-input",
  "qui-option",
  "qui-popover",
  "qui-radio",
  "qui-radio-group",
  "qui-select",
  "qui-switch",
  "qui-tab-list",
  "qui-tab-panel",
  "qui-tabs",
  "qui-tab-trigger",
  "qui-textarea",
] as const;

function shadowLinks(html: string): string[] {
  return [...html.matchAll(SHADOW_LINK)].map((match) => match[0]);
}

describe("shadow DOM SSR", () => {
  it("renders a DSD template with an external stylesheet link", async () => {
    const { renderToString } = await loadHydrate();
    const { html, diagnostics } = await renderToString(
      '<qui-button variant="filled">Save</qui-button>',
      withShadowStylesheet({ href: "/assets/qui.css" }, { fullDocument: false }),
    );

    expect(diagnostics).toEqual([]);
    expect(html).toContain('<template shadowrootmode="open">');
    expect(html).toContain('href="/assets/qui.css"');
    expect(html).toContain("data-qui-styles");
    expect(html).toContain("data-qui-shadow-styles");
    expect(html).toContain('<button data-scope="button" data-part="root"');
    expect(html).not.toMatch(INLINE_STYLE);
  });

  it("adds the document stylesheet link to full documents", async () => {
    const { renderToString } = await loadHydrate();
    const { html, diagnostics } = await renderToString(
      '<qui-button variant="filled">Save</qui-button>',
      withShadowStylesheet({ href: "/assets/qui.css" }),
    );

    expect(diagnostics).toEqual([]);
    expect(html).toMatch(HEAD_STYLESHEET);
    expect(shadowLinks(html).length).toBeGreaterThanOrEqual(2);
  });

  it("marks an existing document stylesheet link without duplicating it", async () => {
    const { renderToString } = await loadHydrate();
    const { html } = await renderToString(
      '<!doctype html><html><head><link rel="stylesheet" href="/assets/qui.css"></head><body><qui-button>Save</qui-button></body></html>',
      withShadowStylesheet({ href: "/assets/qui.css" }),
    );

    const head = html.slice(html.indexOf("<head"), html.indexOf("</head>"));
    expect([...head.matchAll(/<link[^>]*href="\/assets\/qui\.css"[^>]*>/gu)]).toHaveLength(1);
    expect(head).toContain("data-qui-styles");
  });

  it("applies a nonce to generated stylesheet links", async () => {
    const { renderToString } = await loadHydrate();
    const { html } = await renderToString(
      '<qui-button variant="filled">Save</qui-button>',
      withShadowStylesheet({ href: "/assets/qui.css", nonce: "test-nonce" }),
    );

    expect(html).toMatch(HEAD_STYLESHEET);
    expect([...html.matchAll(/nonce="test-nonce"/gu)].length).toBeGreaterThanOrEqual(2);
  });

  it("does not read the browser runtime href during SSR", async () => {
    const { renderToString } = await loadHydrate();
    setQuiStylesHref("/runtime.css");
    try {
      const { html } = await renderToString(
        '<qui-button variant="filled">Save</qui-button>',
        withShadowStylesheet({ href: "/ssr.css" }, { fullDocument: false }),
      );

      expect(html).toContain('href="/ssr.css"');
      expect(html).not.toContain('href="/runtime.css"');
    } finally {
      resetQuiStylesHref();
    }
  });

  it("supports hydrateDocument with the same style options", async () => {
    const { createWindowFromHtml, hydrateDocument } = await loadHydrate();
    const window = createWindowFromHtml(
      '<!doctype html><html><head></head><body><qui-button variant="filled">Save</qui-button></body></html>',
      "ssr-document-test",
    );

    const { html, diagnostics } = await hydrateDocument(window.document, {
      ...withShadowStylesheet({ href: "/assets/qui.css" }),
      serializeToHtml: true,
    });

    expect(diagnostics).toEqual([]);
    expect(html).toContain('<template shadowrootmode="open">');
    expect(html).toMatch(HEAD_STYLESHEET);
    expect(shadowLinks(html ?? "").length).toBeGreaterThanOrEqual(2);
  });

  it("can disable shadow root serialization", async () => {
    const { renderToString } = await loadHydrate();
    const { html } = await renderToString(
      '<qui-button variant="filled">Save</qui-button>',
      withShadowStylesheet({ href: "/assets/qui.css" }, { serializeShadowRoot: false }),
    );

    expect(html).not.toContain("shadowrootmode");
  });

  it("renders every component without diagnostics", async () => {
    const { renderToString } = await loadHydrate();
    const { html, diagnostics } = await renderToString(
      ALL_COMPONENTS,
      withShadowStylesheet({ href: "/assets/qui.css" }, { fullDocument: false }),
    );

    expect(diagnostics).toEqual([]);
    for (const tag of ALL_COMPONENT_TAGS) {
      expect(html).toContain(`<${tag}`);
    }
  });

  it("buffers streamToString into a single chunk", async () => {
    const { streamToString } = await loadHydrate();
    const chunks: string[] = [];

    for await (const chunk of streamToString(
      '<qui-button variant="filled">Save</qui-button>',
      withShadowStylesheet({ href: "/assets/qui.css" }, { fullDocument: false }),
    )) {
      chunks.push(String(chunk));
    }

    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toContain('<template shadowrootmode="open">');
    expect(chunks[0]).toContain('href="/assets/qui.css"');
    expect(chunks[0]).toContain("data-qui-styles");
  });

  it("injects styles into nested shadow roots", async () => {
    const { renderToString } = await loadHydrate();
    const { html } = await renderToString(
      '<qui-select><qui-option value="a">Apple</qui-option><qui-option value="b">Banana</qui-option></qui-select>',
      withShadowStylesheet(
        { href: ["/assets/theme-overrides.css", "/assets/qui.css"] },
        { fullDocument: false },
      ),
    );

    expect(html).toContain("qui-popover");
    expect(html).toContain('href="/assets/theme-overrides.css"');
    expect(html).toContain('href="/assets/qui.css"');
    expect(shadowLinks(html).length).toBeGreaterThanOrEqual(4);
  });

  it("marks hideable content hosts as hydrated in SSR output", async () => {
    const { renderToString } = await loadHydrate();
    const { html, diagnostics } = await renderToString(
      `
        <qui-popover>Popover</qui-popover>
        <qui-select><qui-option value="a">Apple</qui-option></qui-select>
        <qui-combobox></qui-combobox>
        <qui-dialog>
          <qui-dialog-trigger>Open</qui-dialog-trigger>
          <qui-dialog-content>Body</qui-dialog-content>
        </qui-dialog>
        <qui-tabs>
          <qui-tab-list><qui-tab-trigger value="a">A</qui-tab-trigger></qui-tab-list>
          <qui-tab-panel value="a">Panel</qui-tab-panel>
        </qui-tabs>
        <qui-accordion>
          <qui-accordion-item value="a">
            <qui-accordion-trigger>A</qui-accordion-trigger>
            <qui-accordion-content>Body</qui-accordion-content>
          </qui-accordion-item>
        </qui-accordion>
      `,
      withShadowStylesheet({ href: "/assets/qui.css" }, { fullDocument: false }),
    );

    expect(diagnostics).toEqual([]);
    for (const tag of UNDEFINED_CONTENT_TAGS) {
      expect(html).toMatch(
        new RegExp(`<${tag}(?=[\\s>])[^>]*\\bclass="(?:[^"]*\\s)?hydrated(?:\\s[^"]*)?"`, "u"),
      );
    }
  });
});

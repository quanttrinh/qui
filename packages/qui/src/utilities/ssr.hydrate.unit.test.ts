import { describe, expect, it } from "vitest";

import { UNDEFINED_CONTENT_TAGS } from "../../build/undefined-content";
import { loadHydrate } from "../test-utils/hydrate";
import { withShadowStylesheet } from "./ssr";

const SHADOW_LINK = /<link[^>]*data-qui-styles[^>]*>/gu;
const INLINE_STYLE = /<style[^>]*>[^<]*\.d_inline-block/u;

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

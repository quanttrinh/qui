import { describe, expect, it } from "vitest";

import { rollup, vite } from "./index";

type TransformHandler = (code: string, id: string) => { code: string; map: unknown } | undefined;
type IdHandler = (id: string) => string | undefined;
type LoadHandler = (id: string) => string | undefined | Promise<string | undefined>;

const EXTERNAL_ADAPTER_ERROR = /Vite/u;
const EMPTY_HREF_ERROR = /non-empty href/u;
const MALFORMED_HREF_ERROR = /string or string array/u;

describe("vite adapter", () => {
  it("keeps v3 hook filters and injects the virtual registration import", () => {
    const plugin = vite();
    const transform = plugin.transform as unknown as {
      filter: { code: RegExp; id: unknown };
      handler: TransformHandler;
    };

    expect(transform.filter.id).toBeDefined();
    expect(transform.filter.code.test('h("qui-button")')).toBe(true);
    expect(transform.filter.code.test(String.raw`h("qui\u002Dbutton")`)).toBe(true);
    expect(transform.filter.code.test("export const value = 1;")).toBe(false);

    const result = transform.handler("<qui-button />", "/app/view.tsx");
    expect(result?.code).toContain('import "virtual:qui/register?components=qui-button";');
    expect(result?.map).toMatchObject({ version: 3, sources: ["/app/view.tsx"] });
    expect(JSON.stringify(result?.map)).not.toContain("sourcesContent");
  });

  it("resolves and loads the generated virtual module", async () => {
    const plugin = vite();
    const resolveId = plugin.resolveId as unknown as { handler: IdHandler };
    const load = plugin.load as unknown as { handler: LoadHandler };
    const specifier = "virtual:qui/register?components=qui-button";

    const resolved = resolveId.handler(specifier);
    expect(resolved).toBe(`\0${specifier}`);
    if (resolved === undefined) {
      throw new Error("Expected the virtual module to resolve");
    }

    const code = await load.handler(resolved);
    expect(code).toContain('import "virtual:qui/styles";');
    expect(code).toContain('from "@quanttrinh/qui/shared/qui-button"');
    expect(code).toContain("defineComponents(__qui_0);");
  });

  it("resolves and loads the shadow styles module", async () => {
    const plugin = vite();
    const resolveId = plugin.resolveId as unknown as { handler: IdHandler };
    const load = plugin.load as unknown as { handler: LoadHandler };
    const resolved = resolveId.handler("virtual:qui/styles");

    expect(resolved).toBe("\0virtual:qui/styles");
    if (resolved === undefined) {
      throw new Error("Expected the virtual styles module to resolve");
    }

    const code = await load.handler(resolved);
    expect(code).toContain('from "@quanttrinh/qui/runtime"');
    expect(code).toContain("URL.createObjectURL");
    expect(code).toContain("getQuiStylesHref() === undefined");
    expect(code).toContain("--font-fallback");
  });

  it("loads an external stylesheet module and marks the document link", async () => {
    const plugin = vite({ styles: { href: "/assets/app.css" } });
    const resolveId = plugin.resolveId as unknown as { handler: IdHandler };
    const load = plugin.load as unknown as { handler: LoadHandler };
    const transformIndexHtml = plugin.transformIndexHtml as unknown as {
      handler: (html: string) => string;
    };
    const resolved = resolveId.handler("virtual:qui/styles");

    expect(resolved).toBe("\0virtual:qui/styles");
    if (resolved === undefined) {
      throw new Error("Expected the virtual styles module to resolve");
    }

    const code = await load.handler(resolved);
    expect(code).not.toContain("@quanttrinh/qui/runtime");
    expect(code).not.toContain("setQuiStylesHref");
    expect(code).not.toContain("URL.createObjectURL");
    expect(code).not.toContain("@quanttrinh/qui/theme.css");

    const html = transformIndexHtml.handler('<link rel="stylesheet" href="/assets/app.css">');
    expect(html).toContain("data-qui-styles");
  });

  it("marks links after applying the Vite base", () => {
    const plugin = vite({ styles: { href: "/assets/app.css" } });
    const configResolved = plugin.configResolved as unknown as (config: { base: string }) => void;
    const transformIndexHtml = plugin.transformIndexHtml as unknown as {
      handler: (html: string) => string;
    };
    configResolved({ base: "/qui/" });

    const html = transformIndexHtml.handler('<link rel="stylesheet" href="/qui/assets/app.css">');
    expect(html).toContain("data-qui-styles");
  });

  it("rejects malformed external href values", () => {
    expect(() => vite({ styles: { href: 123 } } as unknown as Parameters<typeof vite>[0])).toThrow(
      MALFORMED_HREF_ERROR,
    );
  });

  it("rejects external styles outside Vite", () => {
    try {
      rollup({ styles: { href: "/assets/app.css" } });
      expect.unreachable("Expected external styles to be rejected");
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toMatch(EXTERNAL_ADAPTER_ERROR);
    }
  });

  it("rejects empty external hrefs", () => {
    expect(() => vite({ styles: { href: "" } })).toThrow(EMPTY_HREF_ERROR);
    expect(() => vite({ styles: { href: [] } })).toThrow(EMPTY_HREF_ERROR);
    expect(() => vite({ styles: { href: ["", "/app.css"] } })).not.toThrow();
  });

  it("injects after MDX frontmatter and skips Astro pages", () => {
    const plugin = vite();
    const transform = plugin.transform as unknown as { handler: TransformHandler };
    const mdx = transform.handler("---\ntitle: Example\n---\n<qui-button />", "/app/page.mdx");
    const emptyMdx = transform.handler("---\n---\n<qui-button />", "/app/page.mdx");
    const eofMdx = transform.handler("---\ntitle: <qui-button />\n---", "/app/page.mdx");
    const crlfEofMdx = transform.handler("---\r\ntitle: <qui-button />\r\n---", "/app/page.mdx");
    const trailingFenceMdx = transform.handler("---\n---   \n<qui-button />", "/app/page.mdx");
    const astro = transform.handler("---\n---\n<qui-button />", "/app/page.astro");

    expect(mdx?.code.startsWith("---\ntitle: Example\n---\nimport ")).toBe(true);
    expect(emptyMdx?.code.startsWith("---\n---\nimport ")).toBe(true);
    expect(eofMdx?.code.startsWith("---\ntitle: <qui-button />\n---\nimport ")).toBe(true);
    expect(crlfEofMdx?.code.startsWith("---\r\ntitle: <qui-button />\r\n---\nimport ")).toBe(true);
    expect(trailingFenceMdx?.code.startsWith("---\n---   \nimport ")).toBe(true);
    expect(astro).toBeUndefined();
  });

  it("ignores modules without components", () => {
    const plugin = vite();
    const transform = plugin.transform as unknown as { handler: TransformHandler };

    expect(transform.handler("export const value = 1;", "/app/value.ts")).toBeUndefined();
  });
});

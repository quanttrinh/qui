import { describe, expect, it, vi } from "vitest";

import { markExternalStylesheetLinks, resolveStylesheetHrefs, rollup, vite } from "./index";

vi.mock("node:module", () => ({
  createRequire: () => ({ resolve: () => "/virtual/qui/styles.css" }),
}));

vi.mock("node:fs/promises", () => ({
  readFile: vi.fn().mockResolvedValue(":host{display:block;--font-fallback:test;}"),
}));

type TransformHandler = (code: string, id: string) => { code: string; map: unknown } | undefined;
type IdHandler = (id: string) => string | undefined;
type LoadHandler = (id: string) => string | undefined | Promise<string | undefined>;
type ConfigResolved = (config: {
  base: string;
  command?: "serve" | "build";
  mode?: string;
  isSsrBuild?: boolean;
  build?: { ssr?: boolean | string };
}) => void;

const EXTERNAL_ADAPTER_ERROR = /Vite/u;
const EMPTY_HREF_ERROR = /non-empty href/u;
const MALFORMED_HREF_ERROR = /resolver function/u;

describe("vite adapter", () => {
  it("injects the virtual registration import", () => {
    const plugin = vite();
    const transform = plugin.transform as unknown as {
      filter: unknown;
      handler: TransformHandler;
    };

    expect(transform.filter).toBeDefined();

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
      handler: (html: string) => string | Promise<string>;
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

    const html = await transformIndexHtml.handler('<link rel="stylesheet" href="/assets/app.css">');
    expect(html).toContain("data-qui-styles");
  });

  it("marks links after applying the Vite base", async () => {
    const plugin = vite({ styles: { href: "/assets/app.css" } });
    const configResolved = plugin.configResolved as unknown as (config: { base: string }) => void;
    const transformIndexHtml = plugin.transformIndexHtml as unknown as {
      handler: (html: string) => string | Promise<string>;
    };
    configResolved({ base: "/qui/" });

    const html = await transformIndexHtml.handler(
      '<link rel="stylesheet" href="/qui/assets/app.css">',
    );
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

describe("stylesheet resolvers", () => {
  const BUILD_CONTEXT = {
    command: "build",
    mode: "production",
    base: "/",
    isSsrBuild: false,
  } as const;

  it("resolves a hashed stylesheet from the build bundle", async () => {
    const plugin = vite({
      styles: {
        href: ({ bundle, command, mode }) => {
          expect(command).toBe("build");
          expect(mode).toBe("production");
          const asset = Object.values(bundle ?? {}).find(
            (entry) => entry.type === "asset" && entry.fileName.endsWith(".css"),
          );
          return asset === undefined ? undefined : `/${asset.fileName}`;
        },
      },
    });
    const transformIndexHtml = plugin.transformIndexHtml as unknown as {
      handler: (
        html: string,
        context: { path: string; filename: string; bundle: unknown },
      ) => Promise<string>;
    };

    const html = await transformIndexHtml.handler(
      '<link rel="stylesheet" href="/assets/app-a1b2c3.css">',
      {
        path: "/",
        filename: "/app/index.html",
        bundle: {
          "assets/app-a1b2c3.css": {
            type: "asset",
            fileName: "assets/app-a1b2c3.css",
          },
        },
      },
    );

    expect(html).toContain('href="/assets/app-a1b2c3.css" data-qui-styles');
  });

  it("supports async href resolvers", async () => {
    const plugin = vite({
      styles: {
        href: async () => {
          await Promise.resolve();
          return "/assets/app.css";
        },
      },
    });
    const transformIndexHtml = plugin.transformIndexHtml as unknown as {
      handler: (html: string) => Promise<string>;
    };

    const html = await transformIndexHtml.handler('<link rel="stylesheet" href="/assets/app.css">');

    expect(html).toContain("data-qui-styles");
  });

  it("marks SSR-rendered HTML from a build manifest", async () => {
    const html = await markExternalStylesheetLinks(
      '<html><head><link rel="stylesheet" href="/assets/app-a1b2c3.css"></head></html>',
      {
        href: ({ bundle }) => {
          const file = Object.keys(bundle ?? {}).find((name) => name.endsWith(".css"));
          return file === undefined ? undefined : `/${file}`;
        },
      },
      {
        ...BUILD_CONTEXT,
        isSsrBuild: true,
        bundle: {
          "assets/app-a1b2c3.css": {
            type: "asset",
            fileName: "assets/app-a1b2c3.css",
          },
        },
      },
    );

    expect(html).toContain("data-qui-styles");
  });

  it("applies a non-root base to an array of resolved URLs", async () => {
    const plugin = vite({
      styles: { href: () => ["/assets/first.css", "/assets/second.css"] },
    });
    const configResolved = plugin.configResolved as unknown as ConfigResolved;
    const transformIndexHtml = plugin.transformIndexHtml as unknown as {
      handler: (html: string) => Promise<string>;
    };
    configResolved({ base: "/app/" });

    const html = await transformIndexHtml.handler(
      '<link rel="stylesheet" href="/app/assets/first.css"><link rel="stylesheet" href="/app/assets/second.css">',
    );

    expect(html.match(/data-qui-styles/gu)).toHaveLength(2);
  });

  it("marks a link when the configured href already includes the base", async () => {
    const plugin = vite({ styles: { href: "/app/assets/app.css" } });
    const configResolved = plugin.configResolved as unknown as ConfigResolved;
    const transformIndexHtml = plugin.transformIndexHtml as unknown as {
      handler: (html: string) => Promise<string>;
    };
    configResolved({ base: "/app/" });

    const html = await transformIndexHtml.handler(
      '<link rel="stylesheet" href="/app/app/assets/app.css">',
    );

    expect(html).toContain("data-qui-styles");
  });

  it("marks SSR HTML with a static href and a non-root base", async () => {
    const html = await markExternalStylesheetLinks(
      '<link rel="stylesheet" href="/app/assets/app.css">',
      { href: "/assets/app.css" },
      { ...BUILD_CONTEXT, base: "/app/" },
    );

    expect(html).toContain('href="/app/assets/app.css" data-qui-styles');
  });

  it("propagates resolver rejection", async () => {
    await expect(
      markExternalStylesheetLinks(
        '<link rel="stylesheet" href="/assets/app.css">',
        {
          href: async () => {
            await Promise.resolve();
            throw new Error("resolver failed");
          },
        },
        BUILD_CONTEXT,
      ),
    ).rejects.toThrow("resolver failed");
  });

  it("leaves HTML unchanged when styles are not external", async () => {
    const html = '<link rel="stylesheet" href="/assets/app.css">';

    await expect(markExternalStylesheetLinks(html, false, BUILD_CONTEXT)).resolves.toBe(html);
    await expect(markExternalStylesheetLinks(html, { theme: true }, BUILD_CONTEXT)).resolves.toBe(
      html,
    );
  });

  it("exports resolveStylesheetHrefs from the package root", async () => {
    await expect(resolveStylesheetHrefs("/assets/app.css", BUILD_CONTEXT)).resolves.toEqual([
      "/assets/app.css",
    ]);
  });

  it("rejects malformed styles in the SSR helper", async () => {
    await expect(
      markExternalStylesheetLinks(
        '<link rel="stylesheet" href="/assets/app.css">',
        { href: 123 } as unknown as Parameters<typeof markExternalStylesheetLinks>[1],
        BUILD_CONTEXT,
      ),
    ).rejects.toThrow(MALFORMED_HREF_ERROR);
  });
});

describe("resolver context", () => {
  it("reports client and SSR builds from the resolved config", async () => {
    await Promise.all(
      (
        [
          [false, false],
          [true, true],
        ] as const
      ).map(async ([ssr, expected]) => {
        const seen: boolean[] = [];
        const plugin = vite({
          styles: {
            href: ({ isSsrBuild }) => {
              seen.push(isSsrBuild);
              return "/assets/app.css";
            },
          },
        });
        const configResolved = plugin.configResolved as unknown as ConfigResolved;
        const transformIndexHtml = plugin.transformIndexHtml as unknown as {
          handler: (html: string) => Promise<string>;
        };
        configResolved({ base: "/", build: { ssr } });

        await transformIndexHtml.handler('<link rel="stylesheet" href="/assets/app.css">');
        expect(seen).toEqual([expected]);
      }),
    );
  });

  it("honors an explicit isSsrBuild flag", async () => {
    let seen: boolean | undefined;
    const plugin = vite({
      styles: {
        href: ({ isSsrBuild }) => {
          seen = isSsrBuild;
          return "/assets/app.css";
        },
      },
    });
    const configResolved = plugin.configResolved as unknown as ConfigResolved;
    const transformIndexHtml = plugin.transformIndexHtml as unknown as {
      handler: (html: string) => Promise<string>;
    };
    configResolved({ base: "/", isSsrBuild: true });

    await transformIndexHtml.handler('<link rel="stylesheet" href="/assets/app.css">');
    expect(seen).toBe(true);
  });

  it("resolves in serve mode without a build bundle", async () => {
    const server = {};
    const seen: unknown[] = [];
    const plugin = vite({
      styles: {
        href: ({ command, bundle, server: devServer }) => {
          seen.push({ command, bundle, devServer });
          return "/assets/app.css";
        },
      },
    });
    const configResolved = plugin.configResolved as unknown as ConfigResolved;
    const transformIndexHtml = plugin.transformIndexHtml as unknown as {
      handler: (html: string, context: { server: unknown }) => Promise<string>;
    };
    configResolved({ base: "/", command: "serve", mode: "development" });

    const html = await transformIndexHtml.handler(
      '<link rel="stylesheet" href="/assets/app.css">',
      { server },
    );

    expect(html).toContain("data-qui-styles");
    expect(seen).toEqual([{ command: "serve", bundle: undefined, devServer: server }]);
  });
});

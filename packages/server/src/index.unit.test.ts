import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";

import {
  collectComponents,
  createQuiRenderer,
  createWindowFromHtml,
  hydrateDocument,
  renderPage,
  renderToStream,
  renderToString,
  resolveStylesheetHrefs,
  writeRegistrationManifest,
} from "./index";

describe("server SSR helpers", () => {
  it("re-exports the shared stylesheet resolver", async () => {
    await expect(
      resolveStylesheetHrefs("/assets/app.css", {
        command: "build",
        mode: "production",
        base: "/app/",
        isSsrBuild: true,
      }),
    ).resolves.toEqual(["/app/assets/app.css"]);
  });

  it("collects component tags from rendered markup", () => {
    expect(
      collectComponents(
        "<qui-card><qui-button>Save</qui-button><template><qui-option></qui-option></template></qui-card>",
      ),
    ).toEqual(["qui-button", "qui-card", "qui-option"]);
  });

  it("renderToString applies styles and returns serialized fragments", async () => {
    const result = await renderToString('<qui-button variant="filled">Save</qui-button>', {
      fullDocument: false,
      styles: { href: "/assets/qui.css", nonce: "ssr-nonce" },
    });

    expect(result.diagnostics).toEqual([]);
    expect(result.components).toEqual(["qui-button"]);
    expect(result.registration.components).toEqual(["qui-button"]);
    expect(result.registration.module).toContain('from "@quanttrinh/qui/shared/qui-button"');
    expect(JSON.parse(result.registration.manifest)).toEqual({
      components: ["qui-button"],
    });
    expect(result.html).toContain('<template shadowrootmode="open">');
    expect(result.html).toContain('href="/assets/qui.css"');
    expect([...result.html.matchAll(/nonce="ssr-nonce"/gu)]).toHaveLength(1);
  });

  it("hydrateDocument always returns serialized HTML", async () => {
    const window = createWindowFromHtml(
      '<!doctype html><html><head></head><body><qui-button variant="filled">Save</qui-button></body></html>',
      "server-hydrate-document",
    );

    const result = await hydrateDocument(window.document, {
      styles: { href: "/assets/qui.css" },
    });

    expect(result.diagnostics).toEqual([]);
    expect(result.components).toEqual(["qui-button"]);
    expect(result.html).toContain('<template shadowrootmode="open">');
    expect(result.html).toMatch(/<head[\s\S]*data-qui-styles/u);
  });

  it("hydrates an HTML string without a cached template window", async () => {
    const result = await hydrateDocument(
      '<!doctype html><html><head></head><body><qui-button variant="filled">Save</qui-button></body></html>',
      { styles: { href: "/assets/qui.css" } },
    );

    expect(result.diagnostics).toEqual([]);
    expect(result.components).toEqual(["qui-button"]);
    expect(result.html).toContain('<template shadowrootmode="open">');
    expect(result.html).toMatch(/<head[\s\S]*data-qui-styles/u);
  });

  it("renderPage generates the document shell", async () => {
    const result = await renderPage('<qui-button variant="filled">Save</qui-button>', {
      title: "Settings & profile",
      themeHref: "/assets/theme.css",
      styles: { href: "/assets/qui.css", nonce: "page-nonce" },
      htmlAttributes: { "data-app": "true" },
      bodyAttributes: { class: "page" },
    });

    expect(result.diagnostics).toEqual([]);
    expect(result.components).toEqual(["qui-button"]);
    expect(result.html).toContain("<!doctype html>");
    expect(result.html).toContain("<title>Settings &amp; profile</title>");
    expect(result.html).toContain(
      '<link rel="stylesheet" href="/assets/theme.css" nonce="page-nonce">',
    );
    expect(result.html).toContain(
      '<link rel="stylesheet" href="/assets/qui.css" nonce="page-nonce" data-qui-styles>',
    );
    expect(result.html).toContain('<html data-app="true">');
    expect(result.html).toContain('<body class="page">');
    expect(result.html).toContain('<template shadowrootmode="open">');
    expect(result.html).toContain("</body></html>");
  });

  it("resolves a CSP nonce from custom head markup", async () => {
    const result = await renderPage('<qui-button variant="filled">Save</qui-button>', {
      themeHref: "/assets/theme.css",
      styles: { href: "/assets/qui.css" },
      head: '<meta name="csp-nonce" content="head-nonce">',
    });

    expect([...result.html.matchAll(/nonce="head-nonce"/gu)]).toHaveLength(3);
  });

  it("applies a head nonce to streamed shadow links", async () => {
    const chunks: string[] = [];
    for await (const chunk of renderToStream('<qui-button variant="filled">Save</qui-button>', {
      themeHref: "/assets/theme.css",
      styles: { href: "/assets/qui.css" },
      head: '<meta name="csp-nonce" content="head-nonce">',
    })) {
      chunks.push(chunk);
    }

    expect([...chunks.join("").matchAll(/nonce="head-nonce"/gu)]).toHaveLength(3);
  });

  it("renderToStream emits the shell before the rendered body", async () => {
    const chunks: string[] = [];
    let diagnostics: unknown[] | undefined;
    let components: string[] | undefined;

    for await (const chunk of renderToStream('<qui-button variant="filled">Save</qui-button>', {
      title: "Stream",
      styles: { href: "/assets/qui.css" },
      onDiagnostics(value) {
        diagnostics = value;
      },
      onComponents(value) {
        components = value;
      },
    })) {
      chunks.push(chunk);
    }

    expect(chunks[0]).toContain("<!doctype html>");
    expect(chunks[0]).toContain("<title>Stream</title>");
    expect(chunks[0]).toContain("data-qui-styles");
    expect(chunks[1]).toContain('<template shadowrootmode="open">');
    expect(chunks.at(-1)).toBe("</body></html>");
    expect(diagnostics).toEqual([]);
    expect(components).toEqual(["qui-button"]);
  });

  it("createQuiRenderer applies shared defaults", async () => {
    const qui = createQuiRenderer({
      styles: { href: "/assets/qui.css" },
      themeHref: "/assets/theme.css",
    });

    const result = await qui.renderPage('<qui-button variant="filled">Save</qui-button>', {
      title: "Renderer",
    });

    expect(result.html).toContain("<title>Renderer</title>");
    expect(result.html).toContain('href="/assets/theme.css"');
    expect(result.html).toContain('href="/assets/qui.css"');
  });

  it("writes a registration manifest for the unplugin", async () => {
    const directory = await mkdtemp(path.join(tmpdir(), "qui-registration-"));
    try {
      const file = path.join(directory, "components.json");
      await writeRegistrationManifest(file, ["qui-card", "qui-button"]);

      await expect(readFile(file, "utf8")).resolves.toBe(
        '{\n  "components": [\n    "qui-button",\n    "qui-card"\n  ]\n}\n',
      );
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
});

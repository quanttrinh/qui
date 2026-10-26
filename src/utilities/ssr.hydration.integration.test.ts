import { readFileSync } from "node:fs";
import http from "node:http";
import path from "node:path";
import { chromium, firefox, webkit, type Browser, type BrowserType, type Page } from "playwright";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { loadHydrate } from "../test-utils/hydrate";
import { withShadowStylesheet } from "./ssr";

const { extname, join } = path;
const repoRoot = join(import.meta.dirname, "../..");
const wwwRoot = join(repoRoot, "www");
const serverFiles = new Map<string, { contentType: string; file: string }>([
  ["/theme.css", { contentType: "text/css", file: join(wwwRoot, "theme.css") }],
  ["/styles.css", { contentType: "text/css", file: join(wwwRoot, "styles.css") }],
  [
    "/build/qui.esm.js",
    { contentType: "text/javascript", file: join(wwwRoot, "build/qui.esm.js") },
  ],
]);

const engines: { name: string; type: BrowserType }[] = [
  { name: "chromium", type: chromium },
  { name: "firefox", type: firefox },
  { name: "webkit", type: webkit },
];

const fieldMarkup = `<qui-field id="email" required>
  <qui-field-label>Email</qui-field-label>
  <qui-input input-type="email"></qui-input>
  <qui-field-helper-text>We never share it.</qui-field-helper-text>
</qui-field>`;

let server: http.Server;
let origin: string;
let buttonHtml: string;
let fieldHtml: string;

function buildPage(hydrate: boolean, content = buttonHtml): string {
  return `<!doctype html><html><head>
<link rel="stylesheet" href="/theme.css">
<link rel="stylesheet" href="/styles.css" data-qui-styles>
</head><body>
${content}
${hydrate ? '<script type="module" src="/build/qui.esm.js"></script>' : ""}
</body></html>`;
}

function serveHtml(response: http.ServerResponse, hydrate: boolean, content = buttonHtml): void {
  response.writeHead(200, { "content-type": "text/html" });
  response.end(buildPage(hydrate, content));
}

function serveFile(response: http.ServerResponse, file: string, contentType: string): void {
  response.writeHead(200, { "content-type": contentType });
  response.end(readFileSync(file));
}

function serveStatic(response: http.ServerResponse, url: string | undefined): boolean {
  const entry = url === undefined ? undefined : serverFiles.get(url);
  if (entry !== undefined) {
    serveFile(response, entry.file, entry.contentType);
    return true;
  }

  if (url?.startsWith("/build/")) {
    const file = join(wwwRoot, url.slice(1));
    if (extname(file) === ".js") {
      serveFile(response, file, "text/javascript");
      return true;
    }
  }

  return false;
}

function handleRequest(request: http.IncomingMessage, response: http.ServerResponse): void {
  if (request.url === "/") {
    serveHtml(response, false);
    return;
  }
  if (request.url === "/hydrated") {
    serveHtml(response, true);
    return;
  }
  if (request.url === "/field") {
    serveHtml(response, true, fieldHtml);
    return;
  }
  if (serveStatic(response, request.url)) {
    return;
  }

  response.writeHead(404);
  response.end("not found");
}

async function startServer(): Promise<void> {
  server = http.createServer(handleRequest);
  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (address === null || typeof address === "string") {
        throw new Error("Expected a TCP server address");
      }
      origin = `http://127.0.0.1:${address.port}`;
      resolve();
    });
  });
}

async function buttonMetrics(page: Page): Promise<{ background: string; height: string }> {
  return page.evaluate(() => {
    const button = document.querySelector("qui-button");
    const internal = button?.shadowRoot?.querySelector("button");
    if (internal === null || internal === undefined) {
      throw new Error("Expected the shadow button");
    }
    const styles = getComputedStyle(internal);
    return { background: styles.backgroundColor, height: styles.height };
  });
}

async function waitForShadowStylesheet(page: Page, tagName: string): Promise<void> {
  await page.waitForFunction((tag) => {
    const link = document.querySelector(tag)?.shadowRoot?.querySelector("link[data-qui-styles]");
    return link instanceof HTMLLinkElement && link.sheet !== null;
  }, tagName);
}

async function waitForFieldAria(page: Page): Promise<void> {
  await page.waitForFunction(() => {
    const input = document
      .querySelector("qui-field")
      ?.querySelector("qui-input")
      ?.shadowRoot?.querySelector("input");
    if (input === null || input === undefined) {
      return false;
    }
    const reflected: unknown = Reflect.get(input, "ariaLabelledByElements");
    return (
      (Array.isArray(reflected) && reflected.length > 0) || input.hasAttribute("aria-labelledby")
    );
  });
}

interface AxNode {
  ignored?: boolean;
  role?: { value?: string };
  name?: { value?: string };
  description?: { value?: string };
}

/** Reads the browser accessibility tree through the Chromium DevTools protocol. */
async function accessibilityTree(page: Page): Promise<AxNode[]> {
  const client = await page.context().newCDPSession(page);
  try {
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- CDP protocol results are untyped at this boundary.
    const result = (await client.send("Accessibility.getFullAXTree")) as { nodes?: AxNode[] };
    return result.nodes ?? [];
  } finally {
    await client.detach();
  }
}

beforeAll(async () => {
  const { renderToString } = await loadHydrate();
  const [buttonResult, fieldResult] = await Promise.all([
    renderToString(
      '<qui-button variant="filled">Save</qui-button>',
      withShadowStylesheet({ href: "/styles.css" }, { fullDocument: false }),
    ),
    renderToString(
      fieldMarkup,
      withShadowStylesheet({ href: "/styles.css" }, { fullDocument: false }),
    ),
  ]);
  buttonHtml = buttonResult.html;
  fieldHtml = fieldResult.html;
  expect(buttonResult.diagnostics).toEqual([]);
  expect(fieldResult.diagnostics).toEqual([]);
  await startServer();
}, 15_000);

afterAll(async () => {
  if (server !== undefined) {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error === undefined ? resolve() : reject(error)));
    });
  }
});

describe.each(engines)("shadow DOM hydration in $name", ({ type }) => {
  let browser: Browser;

  beforeAll(async () => {
    browser = await type.launch({ headless: true });
  }, 30_000);

  afterAll(async () => {
    await browser?.close();
  });

  it("styles DSD content before custom elements are defined", async () => {
    const page = await browser.newPage();
    try {
      await page.goto(`${origin}/`, { waitUntil: "load" });
      const metrics = await buttonMetrics(page);
      expect(metrics.height).toBe("40px");
      expect(metrics.background).not.toBe("rgba(0, 0, 0, 0)");
    } finally {
      await page.close();
    }
  }, 15_000);

  it("retains the link and does not duplicate content after hydration", async () => {
    const page = await browser.newPage();
    try {
      await page.goto(`${origin}/hydrated`, { waitUntil: "load" });
      await page.waitForFunction(() => customElements.get("qui-button") !== undefined);
      await waitForShadowStylesheet(page, "qui-button");

      const state = await page.evaluate(() => {
        const host = document.querySelector("qui-button");
        const root = host?.shadowRoot;
        return {
          links: root?.querySelectorAll('link[data-qui-styles=""]').length ?? 0,
          buttons: root?.querySelectorAll("button").length ?? 0,
          background:
            root?.querySelector("button") === null
              ? undefined
              : getComputedStyle(root?.querySelector("button") ?? document.body).backgroundColor,
        };
      });

      expect(state.links).toBe(1);
      expect(state.buttons).toBe(1);
      expect(state.background).not.toBe("rgba(0, 0, 0, 0)");
    } finally {
      await page.close();
    }
  }, 15_000);
});

describe("Chromium accessibility tree", () => {
  let browser: Browser;

  beforeAll(async () => {
    browser = await chromium.launch({ headless: true });
  }, 15_000);

  afterAll(async () => {
    await browser?.close();
  });

  it("exposes the hydrated button by role and name", async () => {
    const page = await browser.newPage();
    try {
      await page.goto(`${origin}/hydrated`, { waitUntil: "load" });
      await page.waitForFunction(() => customElements.get("qui-button") !== undefined);
      await waitForShadowStylesheet(page, "qui-button");

      const nodes = await accessibilityTree(page);
      const button = nodes.find(
        (node) =>
          node.ignored !== true && node.role?.value === "button" && node.name?.value === "Save",
      );

      expect(button).toBeDefined();
    } finally {
      await page.close();
    }
  }, 15_000);

  it("resolves a field label and helper text across shadow roots", async () => {
    const page = await browser.newPage();
    try {
      await page.goto(`${origin}/field`, { waitUntil: "load" });
      await page.waitForFunction(
        () =>
          customElements.get("qui-field") !== undefined &&
          customElements.get("qui-input") !== undefined,
      );
      await waitForShadowStylesheet(page, "qui-input");
      await waitForFieldAria(page);

      const nodes = await accessibilityTree(page);
      const textbox = nodes.find(
        (node) =>
          node.ignored !== true && node.role?.value === "textbox" && node.name?.value === "Email",
      );

      expect(textbox).toBeDefined();
      expect(textbox?.description?.value).toBe("We never share it.");
    } finally {
      await page.close();
    }
  }, 15_000);
});

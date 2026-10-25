import { describe, expect, it } from "vitest";

import { vite } from "./index";

type TransformHandler = (code: string, id: string) => { code: string; map: unknown } | undefined;
type IdHandler = (id: string) => string | undefined;

describe("vite adapter", () => {
  it("keeps v3 hook filters and injects the virtual registration import", () => {
    const plugin = vite({ strategy: "shared" });
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

  it("resolves and loads the generated virtual module", () => {
    const plugin = vite({ strategy: "split" });
    const resolveId = plugin.resolveId as unknown as { handler: IdHandler };
    const load = plugin.load as unknown as { handler: IdHandler };
    const specifier = "virtual:qui/register?components=qui-button";

    const resolved = resolveId.handler(specifier);
    expect(resolved).toBe(`\0${specifier}`);
    if (resolved === undefined) {
      throw new Error("Expected the virtual module to resolve");
    }

    const code = load.handler(resolved);
    expect(code).toContain('from "@quanttrinh/qui/split/qui-button"');
    expect(code).toContain("defineComponents(__qui_0);");
  });

  it("ignores modules without components", () => {
    const plugin = vite();
    const transform = plugin.transform as unknown as { handler: TransformHandler };

    expect(transform.handler("export const value = 1;", "/app/value.ts")).toBeUndefined();
  });
});

import { describe, expect, it } from "vitest";

import {
  componentsFromVirtualModuleId,
  createRegistrationModule,
  extractComponents,
  isTransformableId,
  registrationOrder,
  virtualModuleId,
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

  it("falls back to lexical extraction when parsing fails", () => {
    expect(extractComponents("export const x = <qui-button", "/app/broken.tsx")).toEqual([
      "qui-button",
    ]);
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

describe("registrationOrder", () => {
  it("defines parent contexts before the parts that consume them", () => {
    expect(
      registrationOrder([
        "qui-accordion-content",
        "qui-accordion-trigger",
        "qui-accordion-item",
        "qui-accordion",
      ]),
    ).toEqual([
      "qui-accordion",
      "qui-accordion-item",
      "qui-accordion-content",
      "qui-accordion-trigger",
    ]);

    expect(
      registrationOrder(["qui-tab-panel", "qui-tab-trigger", "qui-tab-list", "qui-tabs"]),
    ).toEqual(["qui-tabs", "qui-tab-list", "qui-tab-panel", "qui-tab-trigger"]);

    expect(registrationOrder(["qui-radio", "qui-field", "qui-radio-group"])).toEqual([
      "qui-field",
      "qui-radio-group",
      "qui-radio",
    ]);
  });

  it("keeps unrelated components alphabetical", () => {
    expect(registrationOrder(["qui-select", "qui-button", "qui-input"])).toEqual([
      "qui-button",
      "qui-input",
      "qui-select",
    ]);
  });

  it("emits definitions in dependency order", () => {
    const code = createRegistrationModule(
      ["qui-accordion-content", "qui-accordion-trigger", "qui-accordion", "qui-accordion-item"],
      { styles: false },
    );
    const definitions = [
      ...code.matchAll(
        /defineCustomElement as __qui_\d+\s+\} from "@quanttrinh\/qui\/shared\/(?<tag>qui-[^"]+)"/gu,
      ),
    ].map((match) => match.groups?.tag);

    expect(definitions).toEqual([
      "qui-accordion",
      "qui-accordion-item",
      "qui-accordion-content",
      "qui-accordion-trigger",
    ]);
  });
});

describe("virtual registration module", () => {
  it("round-trips component names through the virtual module id", () => {
    const id = virtualModuleId(["qui-input", "qui-button", "qui-button"]);

    expect(componentsFromVirtualModuleId(id)).toEqual(["qui-button", "qui-input"]);
  });

  it("emits shared registration and shared styles", () => {
    const code = createRegistrationModule(["qui-button"], { strategy: "shared" });

    expect(code).toContain('from "@quanttrinh/qui/register"');
    expect(code).toContain('from "@quanttrinh/qui/shared/qui-button"');
    expect(code).toContain('import "@quanttrinh/qui/theme.css";');
    expect(code).toContain('import "@quanttrinh/qui/styles.css";');
    expect(code).toContain("defineComponents(__qui_0);");
  });

  it("emits split registration, base styles, and per-component styles", () => {
    const code = createRegistrationModule(["qui-button", "qui-input"], { strategy: "split" });

    expect(code).toContain('from "@quanttrinh/qui/split/qui-button"');
    expect(code).toContain('from "@quanttrinh/qui/split/qui-input"');
    expect(code).toContain('import "@quanttrinh/qui/base.css";');
    expect(code).toContain('import "@quanttrinh/qui/split/components/qui-button.css";');
    expect(code).toContain('import "@quanttrinh/qui/split/components/qui-input.css";');
    expect(code).toContain("defineComponents(__qui_0, __qui_1);");
  });

  it("can omit styles", () => {
    const code = createRegistrationModule(["qui-button"], { styles: false });

    expect(code).not.toContain(".css");
  });

  it("returns an empty module when there are no components", () => {
    expect(createRegistrationModule([])).toBe("");
  });
});

describe("isTransformableId", () => {
  it("accepts JavaScript, TypeScript, JSX, Astro, and MDX", () => {
    expect(isTransformableId("/app/src/page.tsx")).toBe(true);
    expect(isTransformableId("/app/src/page.astro")).toBe(true);
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

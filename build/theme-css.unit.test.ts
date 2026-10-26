import { fileURLToPath } from "node:url";
import postcss from "postcss";
import { describe, expect, it } from "vitest";

import { colorRoles, cssVariableNames } from "../src/utilities/theme/color-roles";
import { generateThemeCss } from "./theme-css";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const LAYER_ORDER_DECLARATION = /@layer[^{;]*;/u;
const PROPERTY_RULE = /@property/gu;
const ROOT_BLOCK = /:root\{(?<declarations>[^}]*)\}/u;
const DARK_BLOCK = /\.dark\{(?<declarations>[^}]*)\}/u;
const ROOT_PRIMARY = /:root\{--md-sys-color-primary:#[0-9a-f]{6};/u;
const DARK_PRIMARY = /\.dark\{--md-sys-color-primary:#[0-9a-f]{6};/u;

describe("generateThemeCss", () => {
  it("emits document-only color custom properties", async () => {
    const css = await generateThemeCss(ROOT);

    expect(css).not.toMatch(LAYER_ORDER_DECLARATION);
    expect(css).not.toContain(":host");
    expect(css).toContain("@layer tokens{");
    expect(css).toContain(":root{");
    expect(css).toContain(".dark{");
    for (const role of colorRoles) {
      expect(css).toContain(`${cssVariableNames[role]}:`);
    }
  });

  it("registers every color role as a custom property", async () => {
    const css = await generateThemeCss(ROOT);

    expect(css.match(PROPERTY_RULE)).toHaveLength(colorRoles.length);
    expect(css).toContain("@property --md-sys-color-primary{");
  });

  it("emits parseable light and dark values", async () => {
    const css = await generateThemeCss(ROOT);

    expect(() => postcss.parse(css)).not.toThrow();
    expect(css).toMatch(ROOT_PRIMARY);
    expect(css).toMatch(DARK_PRIMARY);
  });

  it("emits every color role in both schemes", async () => {
    const css = await generateThemeCss(ROOT);
    const root = ROOT_BLOCK.exec(css)?.groups?.declarations ?? "";
    const dark = DARK_BLOCK.exec(css)?.groups?.declarations ?? "";

    for (const role of colorRoles) {
      expect(root).toContain(`${cssVariableNames[role]}:`);
      expect(dark).toContain(`${cssVariableNames[role]}:`);
    }
  });
});

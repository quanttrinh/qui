import { fileURLToPath } from "node:url";
import postcss from "postcss";
import { beforeAll, describe, expect, it } from "vitest";

import { colorRoles, cssVariableNames } from "../src/utilities/theme/color-roles";
import { generateThemeCss } from "./theme-css";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const FULL_LAYER_ORDER = /@layer\s+reset\s*,\s*base[^;]*;/u;
const INDIVIDUAL_LAYERS = ["reset", "base", "tokens", "recipes", "utilities"] as const;
const PROPERTY_RULE = /@property/gu;
const ROOT_BLOCK = /:root\{(?<declarations>[^}]*)\}/u;
const DARK_BLOCK = /\.dark\{(?<declarations>[^}]*)\}/u;
const ROOT_PRIMARY = /:root\{--md-sys-color-primary:#[0-9a-f]{6};/u;
const DARK_PRIMARY = /\.dark\{--md-sys-color-primary:#[0-9a-f]{6};/u;
const PRIMARY_VALUE = /--md-sys-color-primary:(?<value>#[0-9a-f]{6});/u;

let themeCss: string;

beforeAll(async () => {
  themeCss = await generateThemeCss(ROOT);
});

describe("generateThemeCss", () => {
  it("emits document-only color custom properties", () => {
    const css = themeCss;

    expect(css).not.toMatch(FULL_LAYER_ORDER);
    for (const layer of INDIVIDUAL_LAYERS) {
      expect(css).toContain(`@layer ${layer};`);
    }
    expect(css).not.toContain(":host");
    expect(css).toContain("@layer base{");
    expect(css).toContain(":root{");
    expect(css).toContain(".dark{");
    for (const role of colorRoles) {
      expect(css).toContain(`${cssVariableNames[role]}:`);
    }
  });

  it("registers every color role as a custom property", () => {
    const css = themeCss;

    expect(css.match(PROPERTY_RULE)).toHaveLength(colorRoles.length);
    expect(css).toContain("@property --md-sys-color-primary{");
  });

  it("emits parseable light and dark values", () => {
    const css = themeCss;

    expect(() => postcss.parse(css)).not.toThrow();
    expect(css).toMatch(ROOT_PRIMARY);
    expect(css).toMatch(DARK_PRIMARY);
  });

  it("uses different light and dark primary values", () => {
    const css = themeCss;
    const rootValue =
      ROOT_BLOCK.exec(css)?.groups?.declarations.match(PRIMARY_VALUE)?.groups?.value;
    const darkValue =
      DARK_BLOCK.exec(css)?.groups?.declarations.match(PRIMARY_VALUE)?.groups?.value;

    expect(rootValue).toBeDefined();
    expect(darkValue).toBeDefined();
    expect(rootValue).not.toBe(darkValue);
  });

  it("emits every color role in both schemes", () => {
    const css = themeCss;
    const root = ROOT_BLOCK.exec(css)?.groups?.declarations ?? "";
    const dark = DARK_BLOCK.exec(css)?.groups?.declarations ?? "";

    for (const role of colorRoles) {
      expect(root).toContain(`${cssVariableNames[role]}:`);
      expect(dark).toContain(`${cssVariableNames[role]}:`);
    }
  });
});

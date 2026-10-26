import { describe, expect, it } from "vitest";

import { colorRoles, cssVariableNames } from "../src/utilities/theme/color-roles";
import { generateThemeCss } from "./theme-css";

const LAYER_ORDER_DECLARATION = /@layer[^{;]*;/u;
const PROPERTY_RULE = /@property/gu;

describe("generateThemeCss", () => {
  it("emits document-only color custom properties", async () => {
    const css = await generateThemeCss();

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
    const css = await generateThemeCss();

    expect(css.match(PROPERTY_RULE)).toHaveLength(colorRoles.length);
    expect(css).toContain("@property --md-sys-color-primary{");
  });
});

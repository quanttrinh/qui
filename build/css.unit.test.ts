import { describe, expect, it } from "vitest";

import { stripEmptyLayerDeclarations } from "./css";

const SHARED_CSS = [
  "@layer reset, base, tokens, recipes, utilities;",
  "@layer recipes{@layer base, slots, variants, compound_variants;}",
  "@layer recipes.slots{@layer base, variants, compound_variants;}",
  "@layer reset{a{color:red}}",
  "@layer base{b{color:blue}}",
  "@layer tokens{:root{--color:red}}",
  "@layer utilities{.p_1{padding:1px}}",
].join("");

describe("stripEmptyLayerDeclarations", () => {
  it("removes order-only layer declarations from dependency CSS", () => {
    const css = stripEmptyLayerDeclarations(SHARED_CSS);

    expect(css).not.toContain("@layer reset, base, tokens, recipes, utilities;");
    expect(css).not.toContain("@layer recipes{");
    expect(css).not.toContain("@layer recipes.slots{");
    expect(css.indexOf("@layer reset{")).toBeLessThan(css.indexOf("@layer base{"));
    expect(css.indexOf("@layer base{")).toBeLessThan(css.indexOf("@layer tokens{"));
    expect(css.indexOf("@layer tokens{")).toBeLessThan(css.indexOf("@layer utilities{"));
  });

  it("keeps non-empty layers and their content", () => {
    const css = stripEmptyLayerDeclarations(
      "@layer reset, utilities;@layer utilities{.p_1{padding:1px}}",
    );

    expect(css).toContain("@layer utilities{.p_1{padding:1px}}");
  });
});

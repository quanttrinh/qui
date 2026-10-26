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
  it("removes only the root layer order declaration", () => {
    const css = stripEmptyLayerDeclarations(SHARED_CSS);

    expect(css).not.toContain("@layer reset, base, tokens, recipes, utilities;");
    expect(css).toContain("@layer recipes{@layer base, slots, variants, compound_variants;}");
    expect(css).toContain("@layer recipes.slots{@layer base, variants, compound_variants;}");
  });

  it("keeps top-level layer blocks in canonical order", () => {
    const css = stripEmptyLayerDeclarations(SHARED_CSS);

    expect(css.indexOf("@layer reset{")).toBeLessThan(css.indexOf("@layer base{"));
    expect(css.indexOf("@layer base{")).toBeLessThan(css.indexOf("@layer tokens{"));
    expect(css.indexOf("@layer tokens{")).toBeLessThan(css.indexOf("@layer recipes{"));
    expect(css.indexOf("@layer recipes{")).toBeLessThan(css.indexOf("@layer recipes.slots{"));
    expect(css.indexOf("@layer recipes.slots{")).toBeLessThan(css.indexOf("@layer utilities{"));
  });

  it("leaves unrelated and non-empty layers alone", () => {
    const css = stripEmptyLayerDeclarations(
      "@layer reset, utilities;@layer utilities{.p_1{padding:1px}}",
    );

    expect(css).toContain("@layer reset, utilities;");
    expect(css).toContain("@layer utilities{.p_1{padding:1px}}");
  });
});

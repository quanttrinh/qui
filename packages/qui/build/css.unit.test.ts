import { describe, expect, it } from "vitest";

import { stripRootLayerOrder } from "./css";

const SHARED_CSS = [
  "@layer reset, base, tokens, recipes, utilities;",
  "@layer recipes{@layer base, slots, variants, compound_variants;}",
  "@layer recipes.slots{@layer base, variants, compound_variants;}",
  "@layer reset{a{color:red}}",
  "@layer base{b{color:blue}}",
  "@layer tokens{:root{--color:red}}",
  "@layer utilities{.p_1{padding:1px}}",
].join("");

const ORDER_DECLARATIONS = [
  "@layer reset;",
  "@layer base;",
  "@layer tokens;",
  "@layer recipes;",
  "@layer utilities;",
].join("");

describe("stripRootLayerOrder", () => {
  it("replaces the root order declaration with individual declarations", () => {
    const css = stripRootLayerOrder(SHARED_CSS);

    expect(css).not.toContain("@layer reset, base, tokens, recipes, utilities;");
    expect(css.startsWith(ORDER_DECLARATIONS)).toBe(true);
    expect(css).toContain("@layer recipes{@layer base, slots, variants, compound_variants;}");
    expect(css).toContain("@layer recipes.slots{@layer base, variants, compound_variants;}");
  });

  it("establishes order even when a layer has no block", () => {
    const css = stripRootLayerOrder(
      "@layer reset, base, tokens, recipes, utilities;@layer reset{a{color:red}}@layer utilities{.p_1{padding:1px}}",
    );

    expect(css.startsWith(ORDER_DECLARATIONS)).toBe(true);
    expect(css).not.toContain("@layer recipes{");
  });

  it("leaves non-canonical order declarations untouched", () => {
    const reordered =
      "@layer utilities, recipes, tokens, base, reset;@layer utilities{.u{color:red}}";
    const extended =
      "@layer reset, base, tokens, recipes, utilities, custom;@layer utilities{.u{color:red}}";

    expect(stripRootLayerOrder(reordered)).toBe(reordered);
    expect(stripRootLayerOrder(extended)).toBe(extended);
  });

  it("leaves CSS without the canonical declaration untouched", () => {
    const css = "@layer utilities{.u{}}@layer reset{.r{}}";

    expect(stripRootLayerOrder(css)).toBe(css);
  });
});

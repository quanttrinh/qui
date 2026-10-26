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

const SHUFFLED_CSS = [
  "@layer reset, base, tokens, recipes, utilities;",
  "@layer utilities{.p_1{padding:1px}}",
  "@layer recipes{@layer base, slots, variants, compound_variants;}",
  "@layer tokens{:root{--color:red}}",
  "@layer recipes.slots{@layer base, variants, compound_variants;}",
  "@layer base{b{color:blue}}",
  "@layer reset{a{color:red}}",
].join("");

const CANONICAL_BLOCKS = [
  "@layer reset{",
  "@layer base{",
  "@layer tokens{",
  "@layer recipes{",
  "@layer recipes.slots{",
  "@layer utilities{",
];

function expectCanonicalOrder(css: string): void {
  for (const block of CANONICAL_BLOCKS) {
    expect(css).toContain(block);
  }
  for (let index = 1; index < CANONICAL_BLOCKS.length; index += 1) {
    expect(css.indexOf(CANONICAL_BLOCKS[index - 1] ?? "")).toBeLessThan(
      css.indexOf(CANONICAL_BLOCKS[index] ?? ""),
    );
  }
}

describe("stripEmptyLayerDeclarations", () => {
  it("removes only the root layer order declaration", () => {
    const css = stripEmptyLayerDeclarations(SHARED_CSS);

    expect(css).not.toContain("@layer reset, base, tokens, recipes, utilities;");
    expect(css).toContain("@layer recipes{@layer base, slots, variants, compound_variants;}");
    expect(css).toContain("@layer recipes.slots{@layer base, variants, compound_variants;}");
  });

  it("keeps top-level layer blocks in canonical order", () => {
    expectCanonicalOrder(stripEmptyLayerDeclarations(SHARED_CSS));
  });

  it("reorders shuffled layer blocks into canonical order", () => {
    expectCanonicalOrder(stripEmptyLayerDeclarations(SHUFFLED_CSS));
  });

  it("sorts unknown layers after the known set", () => {
    const css = stripEmptyLayerDeclarations(
      "@layer reset, base, tokens, recipes, utilities;@layer custom{x{color:red}}@layer utilities{.p_1{padding:1px}}@layer reset{a{color:red}}",
    );

    expect(css.indexOf("@layer utilities{")).toBeLessThan(css.indexOf("@layer custom{"));
  });

  it("leaves unrelated and non-empty layers alone", () => {
    const css = stripEmptyLayerDeclarations(
      "@layer reset, utilities;@layer utilities{.p_1{padding:1px}}",
    );

    expect(css).toContain("@layer reset, utilities;");
    expect(css).toContain("@layer utilities{.p_1{padding:1px}}");
  });
});

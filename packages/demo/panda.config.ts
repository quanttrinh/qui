import { defineConfig } from "@pandacss/dev";

export default defineConfig({
  // Consume the component library as a Panda design system: the app loads the
  // library's manifest and only hydrates the components it actually imports.
  designSystem: "@quanttrinh/solid-qui",
  include: ["src/**/*.{ts,tsx}"],
  outdir: "styled-system",
  jsxFramework: "solid",
  // Keep component props (e.g. `Input`'s `mask`) from being treated as style
  // props just because they share a name with a CSS property.
  jsxStyleProps: "minimal",
  optimize: {
    treeshakeDesignSystem: true,
    removeUnusedTokens: true,
    removeUnusedKeyframes: true,
  },
});

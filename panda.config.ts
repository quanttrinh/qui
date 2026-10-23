import type { Preset } from "@pandacss/types";

import { defineConfig } from "@pandacss/dev";

import { colorRoles, cssVariableNames } from "./src/utilities/theme/color-roles";

const colorTokens = Object.fromEntries(
  colorRoles.map((role) => [role, { value: `var(${cssVariableNames[role]})` }]),
);

export const quiPreset: Preset = {
  name: "qui",
  theme: {
    extend: {
      semanticTokens: {
        colors: colorTokens,
      },
    },
  },
  globalCss: {
    body: {
      backgroundColor: "surface",
      color: "onSurface",
      fontFamily: "Roboto, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      lineHeight: "1.5",
    },
    "*": {
      scrollbarWidth: "auto",
      scrollbarColor: `var(${cssVariableNames.outline}) transparent`,
    },
    "*::-webkit-scrollbar": {
      width: "8px",
      height: "8px",
    },
    "*::-webkit-scrollbar-thumb": {
      borderRadius: "full",
      backgroundColor: "outline",
    },
    "html[data-qui-scroll-locked]": {
      overflow: "hidden",
    },
    "html[data-qui-scroll-locked] body": {
      overflow: "hidden",
    },
  },
};

export default defineConfig({
  presets: ["@pandacss/preset-base", "@pandacss/preset-panda", quiPreset],
  preflight: true,
  include: ["./src/**/*.{ts,tsx}"],
  exclude: [],
  outdir: "styled-system",
  jsxFramework: "react",
  jsxStyleProps: "none",
  optimize: {
    removeUnusedTokens: true,
    removeUnusedKeyframes: true,
  },
});

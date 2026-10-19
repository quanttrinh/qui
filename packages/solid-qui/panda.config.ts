import { defineConfig, defineGlobalStyles } from "@pandacss/dev";

import { virtualListRecipe } from "./src/components/containers/VirtualList/virtual-list.styles";
import {
  colorRoles,
  createScheme,
  cssVariableNames,
  schemeToCssVariables,
} from "./src/utilities/theme/color";

const defaultLight = schemeToCssVariables(createScheme({ dark: false }));
const defaultDark = schemeToCssVariables(createScheme({ dark: true }));

const colorTokens = Object.fromEntries(
  colorRoles.map((role) => [role, { value: `var(${cssVariableNames[role]})` }]),
);

const scrollbarStyles = defineGlobalStyles({
  "*": {
    scrollbarWidth: "auto",
    scrollbarColor: `var(${cssVariableNames.outline}) transparent`,
  },
  "*::-webkit-scrollbar": {
    width: "8px",
    height: "8px",
  },
  "*::-webkit-scrollbar-track": {
    backgroundColor: "transparent",
  },
  "*::-webkit-scrollbar-thumb": {
    borderRadius: "full",
    backgroundColor: "outline",
  },
});

const svgStyles = defineGlobalStyles({
  "svg[viewBox]:not([width]):not([height])": {
    boxSize: "1em",
    display: "inline-block",
    verticalAlign: "-0.125em",
    flexShrink: 0,
  },
});

export default defineConfig({
  presets: ["@pandacss/preset-base", "@pandacss/preset-panda"],
  preflight: true,
  include: ["./src/**/*.{ts,tsx}"],
  exclude: [],
  outdir: "styled-system",
  jsxFramework: "solid",
  jsxStyleProps: "minimal",
  optimize: {
    removeUnusedTokens: true,
    removeUnusedKeyframes: true,
  },
  globalCss: {
    ":root": { ...defaultLight, colorScheme: "light" },
    ".dark": { ...defaultDark, colorScheme: "dark" },
    body: {
      backgroundColor: "surface",
      color: "onSurface",
    },
    ...svgStyles,
    ...scrollbarStyles,
  },
  theme: {
    extend: {
      semanticTokens: {
        colors: colorTokens,
      },
      slotRecipes: {
        virtualList: virtualListRecipe,
      },
    },
  },
});

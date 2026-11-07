import { defineConfig, type Preset } from "@pandacss/dev";
import { dirname } from "node:path";

import { colorRoles, cssVariableNames } from "./src/utilities/theme/color-roles";
import { createConfig } from "./tooling/config";
import { undefinedContentSelector } from "./tooling/panda/undefined-content";

// Panda bundles the config before evaluating it, so `__dirname` points at the
// bundle. Prefer the explicit config path when the lint plugin supplies one.
const root =
  process.env.PANDA_CONFIG_PATH === undefined
    ? process.cwd()
    : dirname(process.env.PANDA_CONFIG_PATH);
const config = createConfig(root);

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
    // Keep content that components hide until their first render from showing
    // before the custom elements are registered. Stencil adds its own runtime
    // CSS that keeps component tags hidden until they gain `.hydrated`; this
    // covers the gap before that runtime boots. SSR hosts already carry
    // `.hydrated`, so server-rendered content stays visible until the client
    // takes over.
    [undefinedContentSelector()]: {
      display: "none !important",
    },
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
  include: [config.source.include],
  exclude: [],
  outdir: config.output.styledSystemName,
  jsxFramework: "react",
  jsxStyleProps: "none",
  optimize: {
    removeUnusedTokens: true,
    removeUnusedKeyframes: true,
  },
});

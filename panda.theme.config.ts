import { defineConfig } from "@pandacss/dev";

import {
  colorRoles,
  type ColorVariables,
  createScheme,
  cssVariableNames,
  schemeToCssVariables,
} from "./src/utilities/theme/color";

const light = schemeToCssVariables(createScheme({ dark: false }));
const dark = schemeToCssVariables(createScheme({ dark: true }));

const registrations = Object.fromEntries(
  colorRoles.map((role) => [
    cssVariableNames[role],
    {
      syntax: "<color>",
      inherits: true,
      initialValue: light[cssVariableNames[role]],
    },
  ]),
);

const propertyRegistrations: ColorVariables = Object.fromEntries(
  colorRoles.map((role) => [cssVariableNames[role], "initial"]),
);

export default defineConfig({
  presets: ["@pandacss/preset-base", "@pandacss/preset-panda"],
  preflight: false,
  include: [],
  outdir: "styled-system",
  globalVars: registrations,
  globalCss: {
    // Panda prunes globalVars that are only read. This non-matching write
    // forces the @property registrations to be emitted.
    ":where(#__qui_property_registration)": propertyRegistrations,
    ".dark": dark,
  },
  optimize: {
    propertyFallback: true,
    removeUnusedTokens: true,
    removeUnusedKeyframes: true,
  },
});

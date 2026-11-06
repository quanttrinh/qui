/// <reference types="node" />
import { createJiti } from "jiti";

import {
  type colorRoles,
  type createScheme,
  type cssVariableNames,
  type schemeToColors,
} from "../../src/utilities/theme";
import { type Config } from "../config";
import { layerOrderDeclarations } from "./layer-order";

interface ThemeModule {
  colorRoles: typeof colorRoles;
  createScheme: typeof createScheme;
  cssVariableNames: typeof cssVariableNames;
  schemeToColors: typeof schemeToColors;
}

/**
 * Loads the runtime theme module through jiti so the build can use the same
 * Material dynamic-color code without shipping a second implementation.
 *
 * The Material package uses extensionless ESM imports that Node's native
 * loader rejects. jiti resolves them the same way Panda's config loader does.
 * `moduleCache` stays disabled so watch rebuilds see theme changes.
 */
async function loadThemeModule(config: Config): Promise<ThemeModule> {
  const jiti = createJiti(config.file.themeEntry, {
    interopDefault: true,
    moduleCache: false,
  });
  return (await jiti.import(config.file.themeEntry)) as ThemeModule;
}

function declarations(
  variables: ReturnType<ThemeModule["schemeToColors"]>,
  theme: ThemeModule,
): string {
  return theme.colorRoles
    .map((role) => `${theme.cssVariableNames[role]}:${variables[role]};`)
    .join("");
}

function registrations(
  light: ReturnType<ThemeModule["schemeToColors"]>,
  theme: ThemeModule,
): string {
  return theme.colorRoles
    .map(
      (role) =>
        `@property ${theme.cssVariableNames[role]}{syntax:'<color>';inherits:true;initial-value:${light[role]};}`,
    )
    .join("");
}

/**
 * Generates the document-only theme stylesheet.
 *
 * Both Panda and the runtime consume these tokens, but the theme itself is just
 * custom properties and `@property` registrations. Generating it directly keeps
 * the `:host` fallback out of the file. Individual declarations preserve layer
 * order without triggering Panda's full-order expansion, and values stay in the
 * base layer so app token layers override them.
 */
export async function generateThemeCss(config: Config): Promise<string> {
  const theme = await loadThemeModule(config);
  const light = theme.schemeToColors(theme.createScheme({ dark: false }));
  const dark = theme.schemeToColors(theme.createScheme({ dark: true }));

  return `${layerOrderDeclarations()}${registrations(light, theme)}@layer base{:root{${declarations(light, theme)}}.dark{${declarations(dark, theme)}}}`;
}

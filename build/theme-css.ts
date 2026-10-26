/// <reference types="node" />
import { createJiti } from "jiti";
import { join } from "node:path";

type ThemeModule = typeof import("../src/utilities/theme/color");

/**
 * Loads the runtime theme module through jiti so the build can use the same
 * Material dynamic-color code without shipping a second implementation.
 *
 * The Material package uses extensionless ESM imports that Node's native
 * loader rejects. jiti resolves them the same way Panda's config loader does.
 * `moduleCache` stays disabled so watch rebuilds see theme changes.
 */
async function loadThemeModule(): Promise<ThemeModule> {
  const base =
    typeof __filename === "string" ? __filename : join(process.cwd(), "build/theme-css.ts");
  const jiti = createJiti(base, { interopDefault: true, moduleCache: false });
  return (await jiti.import("../src/utilities/theme/color.ts")) as ThemeModule;
}

function declarations(
  variables: ReturnType<ThemeModule["schemeToCssVariables"]>,
  theme: ThemeModule,
): string {
  return theme.colorRoles
    .map((role) => `${theme.cssVariableNames[role]}:${variables[theme.cssVariableNames[role]]};`)
    .join("");
}

function registrations(
  light: ReturnType<ThemeModule["schemeToCssVariables"]>,
  theme: ThemeModule,
): string {
  return theme.colorRoles
    .map(
      (role) =>
        `@property ${theme.cssVariableNames[role]}{syntax:'<color>';inherits:true;initial-value:${light[theme.cssVariableNames[role]]};}`,
    )
    .join("");
}

/**
 * Generates the document-only theme stylesheet.
 *
 * Both Panda and the runtime consume these tokens, but the theme itself is just
 * custom properties and `@property` registrations. Generating it directly keeps
 * order-only cascade-layer declarations and the `:host` fallback out of the
 * file. The layer block lets app token layers override brand values normally,
 * while Panda's PostCSS plugin only re-expands standalone `@layer a, b;`
 * declarations.
 */
export async function generateThemeCss(): Promise<string> {
  const theme = await loadThemeModule();
  const light = theme.schemeToCssVariables(theme.createScheme({ dark: false }));
  const dark = theme.schemeToCssVariables(theme.createScheme({ dark: true }));

  return `${registrations(light, theme)}@layer tokens{:root{${declarations(light, theme)}}.dark{${declarations(dark, theme)}}}`;
}

/**
 * Material Design 3 color roles and their CSS variable names. Kept free of the
 * Material color utilities so consumers such as the published Panda preset can
 * import it without pulling the runtime scheme code into their configs.
 */
export const colorRoles = [
  "primary",
  "onPrimary",
  "primaryContainer",
  "onPrimaryContainer",
  "inversePrimary",
  "secondary",
  "onSecondary",
  "secondaryContainer",
  "onSecondaryContainer",
  "tertiary",
  "onTertiary",
  "tertiaryContainer",
  "onTertiaryContainer",
  "error",
  "onError",
  "errorContainer",
  "onErrorContainer",
  "background",
  "onBackground",
  "surface",
  "onSurface",
  "surfaceVariant",
  "onSurfaceVariant",
  "surfaceDim",
  "surfaceBright",
  "surfaceContainerLowest",
  "surfaceContainerLow",
  "surfaceContainer",
  "surfaceContainerHigh",
  "surfaceContainerHighest",
  "inverseSurface",
  "inverseOnSurface",
  "outline",
  "outlineVariant",
  "shadow",
  "scrim",
  "surfaceTint",
  "primaryFixed",
  "primaryFixedDim",
  "onPrimaryFixed",
  "onPrimaryFixedVariant",
  "secondaryFixed",
  "secondaryFixedDim",
  "onSecondaryFixed",
  "onSecondaryFixedVariant",
  "tertiaryFixed",
  "tertiaryFixedDim",
  "onTertiaryFixed",
  "onTertiaryFixedVariant",
] as const;

export type ColorRole = (typeof colorRoles)[number];

/** `onPrimaryContainer` -> `on-primary-container`. */
function toKebabCase(value: string): string {
  return value.replaceAll(/[A-Z]/gu, (character) => `-${character.toLowerCase()}`);
}

/** MD3 role -> CSS custom property name, computed once. */
function createCssVariableNames(): Record<ColorRole, `--${string}`> {
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  const names = {} as Record<ColorRole, `--${string}`>;
  for (const role of colorRoles) {
    names[role] = `--md-sys-color-${toKebabCase(role)}`;
  }
  return names;
}

export const cssVariableNames = createCssVariableNames();

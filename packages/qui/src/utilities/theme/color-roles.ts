import { buildRecord } from "./record";

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
  "surfaceTint",
  "inverseSurface",
  "inverseOnSurface",
  "outline",
  "outlineVariant",
  "scrim",
  "shadow",
  "surfaceDim",
  "surfaceBright",
  "surfaceContainerLowest",
  "surfaceContainerLow",
  "surfaceContainer",
  "surfaceContainerHigh",
  "surfaceContainerHighest",
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

const UPPERCASE = /[A-Z]/gu;

/** `onPrimaryContainer` -> `on-primary-container`. */
function toKebabCase(value: string): string {
  return value.replaceAll(UPPERCASE, (character) => `-${character.toLowerCase()}`);
}

/** MD3 role -> CSS custom property name. */
export function cssVariableName(role: ColorRole): `--${string}` {
  return `--md-sys-color-${toKebabCase(role)}`;
}

/** MD3 role -> CSS custom property name. */
export const cssVariableNames = buildRecord(colorRoles, cssVariableName);

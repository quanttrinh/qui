import {
  argbFromHex,
  Hct,
  hexFromArgb,
  MaterialDynamicColors,
  SchemeContent,
  SchemeExpressive,
  SchemeFidelity,
  SchemeFruitSalad,
  SchemeMonochrome,
  SchemeNeutral,
  SchemeRainbow,
  SchemeTonalSpot,
  SchemeVibrant,
  type DynamicColor,
  type DynamicScheme,
} from "@material/material-color-utilities";

/**
 * The Material Design 3 color roles exposed as CSS variables (`--md-sys-color-*`)
 * and, through Panda, as semantic tokens.
 *
 * Everything is derived at runtime from a single source color by
 * `@material/material-color-utilities`; there is no hand-written palette.
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

/** The palette style used to derive the scheme. Maps to the MD3 dynamic scheme variants. */
export type SchemeVariant =
  | "tonalSpot"
  | "vibrant"
  | "expressive"
  | "neutral"
  | "fidelity"
  | "content"
  | "monochrome"
  | "rainbow"
  | "fruitSalad";

const schemeVariants: Record<
  SchemeVariant,
  new (hct: Hct, isDark: boolean, contrastLevel: number) => DynamicScheme
> = {
  tonalSpot: SchemeTonalSpot,
  vibrant: SchemeVibrant,
  expressive: SchemeExpressive,
  neutral: SchemeNeutral,
  fidelity: SchemeFidelity,
  content: SchemeContent,
  monochrome: SchemeMonochrome,
  rainbow: SchemeRainbow,
  fruitSalad: SchemeFruitSalad,
};

export const DEFAULT_SOURCE = "#3e802b";
export const DEFAULT_VARIANT: SchemeVariant = "tonalSpot";
export const DEFAULT_CONTRAST = 0;

export interface ThemeOptions {
  /** Seed color as a hex string. */
  source?: string;
  /** Palette style. */
  variant?: SchemeVariant;
  /** Contrast level from `-1` (minimum) to `1` (maximum). */
  contrast?: number;
  /** Whether to build the dark scheme. */
  dark?: boolean;
}

/**
 * `MaterialDynamicColors` is stateless and its `colorSpec` is fixed, but every
 * accessor (`material.primary()`, …) builds a *new* `DynamicColor`. Resolving them
 * once removes ~49 allocations per scheme change.
 */
const materialColors = new MaterialDynamicColors();
const roleDynamicColorEntries = colorRoles.map((role) => [role, materialColors[role]()] as const);
// oxlint-disable-next-line typescript/no-unsafe-type-assertion
const roleDynamicColors = Object.fromEntries(roleDynamicColorEntries) as Record<
  ColorRole,
  DynamicColor
>;

/**
 * Small bounded caches: `Hct.fromInt` (CAM16) is the most expensive step and only
 * depends on the seed, so it survives variant/contrast/dark changes. Schemes are
 * cached too, which makes toggling modes and revisiting values allocation-free.
 */
const sourceHctCache = new Map<number, Hct>();
const schemeCache = new Map<string, DynamicScheme>();
const SOURCE_CACHE_LIMIT = 64;
const SCHEME_CACHE_LIMIT = 64;

function sourceHct(source: string): Hct {
  const argb = argbFromHex(source);
  const cached = sourceHctCache.get(argb);
  if (cached) {
    return cached;
  }

  const hct = Hct.fromInt(argb);
  if (sourceHctCache.size >= SOURCE_CACHE_LIMIT) {
    const oldest = sourceHctCache.keys().next().value;
    if (oldest !== undefined) {
      sourceHctCache.delete(oldest);
    }
  }
  sourceHctCache.set(argb, hct);
  return hct;
}

/** Build (or reuse) the MD3 dynamic scheme for the given options. */
export function createScheme(options: ThemeOptions = {}): DynamicScheme {
  const {
    source = DEFAULT_SOURCE,
    variant = DEFAULT_VARIANT,
    contrast = DEFAULT_CONTRAST,
    dark = false,
  } = options;

  const key = `${source}|${variant}|${contrast}|${dark}`;
  const cached = schemeCache.get(key);
  if (cached) {
    return cached;
  }

  const SchemeClass = schemeVariants[variant];
  const scheme = new SchemeClass(sourceHct(source), dark, contrast);

  if (schemeCache.size >= SCHEME_CACHE_LIMIT) {
    const oldest = schemeCache.keys().next().value;
    if (oldest !== undefined) {
      schemeCache.delete(oldest);
    }
  }
  schemeCache.set(key, scheme);
  return scheme;
}

const colorsByScheme = new WeakMap<DynamicScheme, Record<ColorRole, string>>();

/** Resolve every role in a scheme to a hex color (cached per scheme). */
export function schemeToColors(scheme: DynamicScheme): Record<ColorRole, string> {
  const cached = colorsByScheme.get(scheme);
  if (cached) {
    return cached;
  }

  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  const colors = {} as Record<ColorRole, string>;

  for (const role of colorRoles) {
    colors[role] = hexFromArgb(roleDynamicColors[role].getArgb(scheme));
  }

  Object.freeze(colors);
  colorsByScheme.set(scheme, colors);
  return colors;
}

/** `onPrimaryContainer` -> `on-primary-container`. */
function toKebabCase(value: string): string {
  return value.replaceAll(/[A-Z]/gu, (character) => `-${character.toLowerCase()}`);
}

const cssVariableEntries = colorRoles.map(
  (role) => [role, `--md-sys-color-${toKebabCase(role)}`] as const,
);

/** MD3 role -> CSS custom property name, computed once. */
// oxlint-disable-next-line typescript/no-unsafe-type-assertion
export const cssVariableNames = Object.fromEntries(cssVariableEntries) as Record<
  ColorRole,
  `--${string}`
>;

/** Custom properties keyed by MD3 variable name. */
export type ColorVariables = Record<`--${string}`, string>;

/** Map resolved colors to MD3 CSS custom properties. */
export function colorsToVariables(colors: Readonly<Record<ColorRole, string>>): ColorVariables {
  const variables = {} as ColorVariables;

  for (const role of colorRoles) {
    variables[cssVariableNames[role]] = colors[role];
  }

  return variables;
}

const variablesByScheme = new WeakMap<DynamicScheme, ColorVariables>();

/** Every role in a scheme as MD3 CSS custom properties (cached per scheme). */
export function schemeToCssVariables(scheme: DynamicScheme): ColorVariables {
  const cached = variablesByScheme.get(scheme);
  if (cached) {
    return cached;
  }

  const variables = colorsToVariables(schemeToColors(scheme));
  Object.freeze(variables);
  variablesByScheme.set(scheme, variables);
  return variables;
}

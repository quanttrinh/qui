import {
  colorRoles,
  createScheme,
  cssVariableNames,
  schemeToColors,
  type ColorRole,
  type ThemeOptions,
} from "./color";

function defaultTarget(): HTMLElement | undefined {
  return typeof document === "undefined" ? undefined : document.documentElement;
}

/** Write every resolved role onto an element as `--md-sys-color-*`. */
export function setColors(colors: Readonly<Record<ColorRole, string>>, target?: HTMLElement): void {
  const element = target ?? defaultTarget();
  if (!element) {
    return;
  }

  // CSSOM property assignment stays allowed under strict style-src policies.
  // Avoid cssText or a style attribute, which CSP treats as inline style.
  for (const role of colorRoles) {
    element.style.setProperty(cssVariableNames[role], colors[role]);
  }
}

/**
 * Builds the requested Material scheme and writes its colors onto an element.
 * Returns the resolved colors so callers can reuse them without recomputing.
 * Outside a DOM environment the colors are returned without being applied.
 */
export function applyTheme(
  options: ThemeOptions = {},
  target?: HTMLElement,
): Readonly<Record<ColorRole, string>> {
  const colors = schemeToColors(createScheme(options));
  setColors(colors, target);
  return colors;
}

/** Remove every role variable from an element, falling back to the stylesheet. */
export function clearColors(target?: HTMLElement): void {
  const element = target ?? defaultTarget();
  if (!element) {
    return;
  }

  for (const role of colorRoles) {
    element.style.removeProperty(cssVariableNames[role]);
  }
}

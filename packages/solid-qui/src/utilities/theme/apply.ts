import { type ColorRole, colorRoles, cssVariableNames } from "./color";

function defaultTarget(): HTMLElement | undefined {
  return typeof document === "undefined" ? undefined : document.documentElement;
}

/** Write every resolved role onto an element as `--md-sys-color-*`. */
export function setColors(colors: Readonly<Record<ColorRole, string>>, target?: HTMLElement): void {
  const element = target ?? defaultTarget();
  if (!element) {
    return;
  }

  for (const role of colorRoles) {
    element.style.setProperty(cssVariableNames[role], colors[role]);
  }
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

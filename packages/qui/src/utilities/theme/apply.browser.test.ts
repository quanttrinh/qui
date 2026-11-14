import { describe, expect, it } from "vitest";

import { applyTheme, clearColors, setColors } from "./apply";
import { colorRoles, cssVariableNames, type ColorRole } from "./color";

function createTarget(): HTMLElement {
  return document.createElement("div");
}

function expectColors(element: HTMLElement, colors: Readonly<Record<ColorRole, string>>): void {
  for (const role of colorRoles) {
    expect(element.style.getPropertyValue(cssVariableNames[role])).toBe(colors[role]);
  }
}

const colors = Object.fromEntries(
  colorRoles.map((role) => [role, `rgb(${role.length} 0 0)`]),
) as Record<ColorRole, string>;

describe("theme application", () => {
  it("writes and clears every role", () => {
    const element = createTarget();

    setColors(colors, element);
    expectColors(element, colors);

    clearColors(element);
    for (const role of colorRoles) {
      expect(element.style.getPropertyValue(cssVariableNames[role])).toBe("");
    }
  });

  it("resolves and applies a theme in one call", () => {
    const element = createTarget();

    const applied = applyTheme({ source: "#3e802b" }, element);

    expect(Object.keys(applied)).toHaveLength(colorRoles.length);
    expectColors(element, applied);
  });

  it("honors scheme options", () => {
    const element = createTarget();
    const light = applyTheme({ source: "#3e802b", dark: false }, element);
    const dark = applyTheme({ source: "#3e802b", dark: true }, element);
    const red = applyTheme({ source: "#ff0000", dark: false }, element);
    const vibrant = applyTheme({ source: "#3e802b", variant: "vibrant" }, element);
    const contrast = applyTheme({ source: "#3e802b", contrast: 1 }, element);

    expect(dark.primary).not.toBe(light.primary);
    expect(red.primary).not.toBe(light.primary);
    expect(vibrant.primary).not.toBe(light.primary);
    expect(contrast.primary).not.toBe(light.primary);
  });

  it("uses the document root when no target is provided", () => {
    const applied = applyTheme({ source: "#3e802b" });

    expectColors(document.documentElement, applied);

    clearColors();
    for (const role of colorRoles) {
      expect(document.documentElement.style.getPropertyValue(cssVariableNames[role])).toBe("");
    }
  });
});

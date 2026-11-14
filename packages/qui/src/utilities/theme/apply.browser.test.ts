import { describe, expect, it } from "vitest";

import { applyTheme, clearColors, setColors } from "./apply";
import { colorRoles, cssVariableNames, type ColorRole } from "./color";

function createTarget(): HTMLElement {
  return document.createElement("div");
}

const colors = Object.fromEntries(
  colorRoles.map((role) => [role, `rgb(${role.length} 0 0)`]),
) as Record<ColorRole, string>;

describe("theme application", () => {
  it("writes and clears every role", () => {
    const element = createTarget();

    setColors(colors, element);
    expect(element.style.length).toBe(colorRoles.length);
    expect(element.style.getPropertyValue(cssVariableNames.primary)).toBe(colors.primary);

    clearColors(element);
    expect(element.style.length).toBe(0);
  });

  it("resolves and applies a theme in one call", () => {
    const element = createTarget();

    const applied = applyTheme({ source: "#3e802b", dark: true }, element);

    expect(Object.keys(applied)).toHaveLength(colorRoles.length);
    expect(element.style.length).toBe(colorRoles.length);
    expect(element.style.getPropertyValue(cssVariableNames.primary)).toBe(applied.primary);
  });
});

/// <reference types="node" />
import postcss from "postcss";

/**
 * Removes layer declarations that contain no rules.
 *
 * Panda's PostCSS integration appends the full design-system stylesheet to every
 * CSS file that declares layer order. Generated dependency CSS must therefore
 * not contain standalone `@layer a, b;` statements. The remaining layer blocks
 * keep their original emission order, which is already reset, base, tokens,
 * recipes, utilities.
 */
export function stripEmptyLayerDeclarations(css: string): string {
  const root = postcss.parse(css);
  let changed = true;

  while (changed) {
    changed = false;
    root.walkAtRules("layer", (atrule) => {
      if (atrule.nodes === undefined || atrule.nodes.length === 0) {
        atrule.remove();
        changed = true;
      }
    });
  }

  return root.toString();
}

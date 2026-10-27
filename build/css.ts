/// <reference types="node" />
import postcss from "postcss";

import { CANONICAL_LAYER_ORDER, layerOrderDeclarations } from "./layer-order";

function isCanonicalLayerOrder(node: postcss.AtRule): boolean {
  if (node.name !== "layer" || node.nodes !== undefined) {
    return false;
  }
  const names = node.params.split(",").map((name) => name.trim());
  return names.join(", ") === CANONICAL_LAYER_ORDER;
}

/**
 * Replaces the root layer order declaration that triggers Panda's PostCSS
 * integration with individual declarations.
 *
 * Individual `@layer reset;` statements establish the same order without
 * matching Panda's full-set trigger. Nested recipe declarations are left intact
 * so their sublayer precedence is preserved.
 */
export function stripRootLayerOrder(css: string): string {
  const root = postcss.parse(css);
  let removed = false;

  for (const node of [...root.nodes]) {
    if (node.type === "atrule" && isCanonicalLayerOrder(node)) {
      node.remove();
      removed = true;
    }
  }

  if (!removed) {
    return css;
  }

  root.prepend(layerOrderDeclarations());
  return root.toString();
}

/// <reference types="node" />
import postcss, { type AtRule, type Root } from "postcss";

import { CANONICAL_LAYER_ORDER, LAYER_ORDER } from "./layer-order";

function isLayerBlock(node: AtRule): boolean {
  return node.name === "layer" && node.nodes !== undefined;
}

function layerRank(node: AtRule): number {
  if (!isLayerBlock(node)) {
    return LAYER_ORDER.length;
  }
  const [name = ""] = node.params.split(".");
  const index = LAYER_ORDER.indexOf(name.trim() as (typeof LAYER_ORDER)[number]);
  return index === -1 ? LAYER_ORDER.length : index;
}

function isCanonicalLayerOrder(node: AtRule): boolean {
  if (node.name !== "layer" || node.nodes !== undefined) {
    return false;
  }
  const names = node.params.split(",").map((name) => name.trim());
  return names.join(", ") === CANONICAL_LAYER_ORDER;
}

/**
 * Removes the exact root layer order declaration that triggers Panda's PostCSS
 * integration, while preserving nested recipe sublayer declarations and the
 * effective layer order.
 *
 * Panda appends the full design-system stylesheet to every CSS file whose layer
 * declaration contains all of `reset, base, tokens, recipes, utilities`. Nested
 * declarations such as `@layer recipes{@layer base, slots;}` do not match that
 * condition, so removing them would only risk changing recipe precedence.
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

  reorderLayerBlocks(root);
  return root.toString();
}

/**
 * After removing the order declaration, layer precedence comes from first
 * appearance. Move top-level layer blocks back into the canonical order so the
 * nested recipe declarations keep their intended position.
 */
function reorderLayerBlocks(root: Root): void {
  const blocks = root.nodes.filter(
    (node): node is AtRule => node.type === "atrule" && isLayerBlock(node),
  );
  if (blocks.length < 2) {
    return;
  }

  const firstLayer = root.nodes.findIndex((node) => node.type === "atrule" && isLayerBlock(node));
  const anchor =
    root.nodes.slice(firstLayer).find((node) => node.type !== "atrule" || !isLayerBlock(node)) ??
    null;
  const sorted = [...blocks].sort((left, right) => {
    const rank = layerRank(left) - layerRank(right);
    if (rank !== 0) {
      return rank;
    }

    const [leftName = ""] = left.params.split(".");
    const [rightName = ""] = right.params.split(".");
    if (leftName !== rightName) {
      return 0;
    }
    return left.params.split(".").length - right.params.split(".").length;
  });
  for (const block of blocks) {
    block.remove();
  }
  for (const block of sorted) {
    if (anchor?.parent) {
      root.insertBefore(anchor, block);
    } else {
      root.append(block);
    }
  }
}

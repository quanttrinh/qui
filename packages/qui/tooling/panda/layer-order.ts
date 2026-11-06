export const LAYER_ORDER = ["reset", "base", "tokens", "recipes", "utilities"] as const;

export const CANONICAL_LAYER_ORDER = LAYER_ORDER.join(", ");

/** Individual declarations that establish order without Panda's full-set trigger. */
export function layerOrderDeclarations(): string {
  return LAYER_ORDER.map((name) => `@layer ${name};`).join("");
}

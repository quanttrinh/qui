/** `""` when true, otherwise `undefined`; useful for boolean data attributes. */
export function dataAttr(value: boolean): "" | undefined {
  return value ? "" : undefined;
}

/** `"true"` when true, otherwise `undefined`; useful for ARIA booleans. */
export function ariaAttr(value: boolean): "true" | undefined {
  return value ? "true" : undefined;
}

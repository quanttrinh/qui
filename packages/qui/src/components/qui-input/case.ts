/** How `qui-input` normalizes the value's case. */
export type TextCase = "none" | "uppercase" | "lowercase";

/**
 * Applies the configured case normalization using JavaScript's locale-neutral
 * case mapping. Case changes may alter the string length for some Unicode
 * characters, so callers that restore a caret should transform the prefix too.
 */
export function applyTextCase(value: string, textCase: TextCase): string {
  if (textCase === "uppercase") {
    return value.toUpperCase();
  }
  if (textCase === "lowercase") {
    return value.toLowerCase();
  }
  return value;
}

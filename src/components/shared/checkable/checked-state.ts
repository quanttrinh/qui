/** The checked state shared by checkbox-like controls. */
export type CheckedState = boolean | "indeterminate";

/** Normalize a Stencil attribute/property value into a checked state. */
export function normalizeChecked(value: unknown): CheckedState | undefined {
  if (value === "indeterminate") {
    return "indeterminate";
  }
  if (value === "" || value === "true" || value === true) {
    return true;
  }
  if (value === "false" || value === false) {
    return false;
  }
  return undefined;
}

/** Normalize a Stencil attribute/property value into a boolean. */
export function normalizeBoolean(value: unknown): boolean | undefined {
  if (value === "" || value === "true" || value === true) {
    return true;
  }
  if (value === "false" || value === false) {
    return false;
  }
  return undefined;
}

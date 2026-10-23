/** A `qui-option` element as read by Select and Combobox. */
export interface OptionElement extends HTMLElement {
  value: string;
  label?: string;
  disabled: boolean;
}

/** Resolve an option's display label from its prop, slot text, or value. */
export function optionLabel(option: OptionElement): string {
  const { label } = option;
  if (label !== undefined && label !== "") {
    return label;
  }
  // TypeScript types textContent as nullable; oxlint resolves it as string.
  // oxlint-disable-next-line typescript/no-unnecessary-condition
  const text = (option.textContent ?? "").trim();
  if (text !== "") {
    return text;
  }
  return option.value;
}

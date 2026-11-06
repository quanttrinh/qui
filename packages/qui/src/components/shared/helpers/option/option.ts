import { type VNode } from "@stencil/core";

export interface OptionItem {
  value: string;
  label: string;
  disabled: boolean;
  /** Extra text (synonyms, aliases) used by searchable controls. */
  keywords?: string;
}

/** State passed to a custom option renderer. */
export interface OptionRenderState {
  /** Zero-based index within the rendered list, after any filtering. */
  index: number;
  /** Whether the option is selected. */
  selected: boolean;
  /** Whether the option is currently highlighted for keyboard navigation. */
  active: boolean;
  /** Whether the option is disabled. */
  disabled: boolean;
}

/**
 * Renders the entire content of one option row, including any selected
 * indicator. When omitted, the row renders the label and a built-in indicator.
 * The row wrapper still owns the listbox semantics and virtualization. Keep the
 * content presentational; nested interactive controls break the listbox model.
 */
export type OptionRender<TItem extends OptionItem = OptionItem> = (
  item: TItem,
  state: OptionRenderState,
) => VNode | VNode[] | string | null | undefined;

/** Label for a value, falling back to the value itself. */
export function labelForValue(items: readonly OptionItem[], value: string): string {
  return items.find((item) => item.value === value)?.label ?? value;
}

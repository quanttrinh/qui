import { createContextStore } from "../shared/context-store";

/** A radio item's component-owned props. */
export interface RadioItem {
  value: string;
  disabled?: boolean;
  invalid?: boolean;
}

/** Resolved state for one radio item. */
export interface RadioItemState {
  checked: boolean;
  disabled: boolean;
  invalid: boolean;
  focused: boolean;
  focusVisible: boolean;
}

/** The radio-group state and ids shared with descendant radio items. */
export interface RadioGroupContext {
  value: () => string | undefined;
  isDisabled: () => boolean;
  isReadOnly: () => boolean;
  isInvalid: () => boolean;
  isRequired: () => boolean;
  orientation: () => "horizontal" | "vertical";
  textDirection: () => "ltr" | "rtl" | undefined;
  itemState: (item: RadioItem) => RadioItemState;
  select: (value: string) => void;
  focus: (value: string, focusVisible: boolean) => void;
  blur: () => void;
  registerInput: (value: string, input: HTMLInputElement) => () => void;
  rootId: () => string;
  itemId: (value: string) => string;
  inputId: (value: string) => string;
  controlId: (value: string) => string;
  labelId: (value: string) => string;
  subscribe: (listener: () => void) => () => void;
}

// oxlint-disable-next-line stencil/ban-side-effects -- Allocating a context map has no side effects.
const groups = createContextStore<RadioGroupContext>("radio-group");

function provideRadioGroup(host: HTMLElement, group: RadioGroupContext): void {
  groups.provide(host, group);
}

function clearRadioGroup(host: HTMLElement): void {
  groups.clear(host);
}

/** Find the closest ancestor radio group, crossing shadow boundaries. */
function consumeRadioGroup(host: HTMLElement): RadioGroupContext | undefined {
  return groups.consume(host);
}

export { clearRadioGroup, consumeRadioGroup, provideRadioGroup };

import type { ContextProviderHandle } from "../shared/context";

import { clearContext, createContext, provideContext } from "../shared/context";

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
  /** Refreshes form validity when an item's disabled state changes. */
  refreshValidation: () => void;
  rootId: () => string;
  itemId: (value: string) => string;
  inputId: (value: string) => string;
  controlId: (value: string) => string;
  labelId: (value: string) => string;
}

export const radioGroupContext = createContext<RadioGroupContext>();

export const provideRadioGroup = (
  host: Element,
  context: RadioGroupContext,
): ContextProviderHandle<RadioGroupContext> => provideContext(host, radioGroupContext, context);

export const clearRadioGroup = (host: Element): void => {
  clearContext(host, radioGroupContext);
};

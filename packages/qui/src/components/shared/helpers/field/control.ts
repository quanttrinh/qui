import { type FieldControlHandle } from "./registry";

/**
 * Creates a field control handle backed by a lazily resolved focusable element.
 *
 * The element is looked up on every call so the handle stays valid across
 * renders and upgrades.
 */
export interface FieldControlOptions {
  /** Click the control as well as focusing it when a label is activated. */
  activateOnLabel?: boolean;
}

export function createFieldControl(
  getElement: () => HTMLElement | undefined,
  options: FieldControlOptions = {},
): FieldControlHandle {
  return {
    focus: (focusOptions) => {
      getElement()?.focus(focusOptions);
    },
    ...(options.activateOnLabel
      ? {
          click: () => {
            getElement()?.click();
          },
        }
      : {}),
  };
}

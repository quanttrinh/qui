import { type FieldControlHandle } from "./registry";

/**
 * Creates a field control handle backed by a lazily resolved focusable element.
 *
 * The element is looked up on every call so the handle stays valid across
 * renders and upgrades.
 */
export function createFieldControl(getElement: () => HTMLElement | undefined): FieldControlHandle {
  return {
    focus: (options): void => {
      getElement()?.focus(options);
    },
    click: (): void => {
      getElement()?.click();
    },
  };
}

/**
 * Focuses an element once the current render has settled.
 *
 * The microtask wait lets a pending render attach the internal element before
 * focus is attempted. Disconnected or missing elements are ignored.
 */
export async function focusElement(
  element: HTMLElement | undefined,
  options?: FocusOptions,
): Promise<void> {
  await Promise.resolve();
  if (element === undefined || !element.isConnected) {
    return;
  }
  element.focus(options);
}

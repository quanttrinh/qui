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
  if (!element || !element.isConnected) {
    return;
  }
  element.focus(options);
}

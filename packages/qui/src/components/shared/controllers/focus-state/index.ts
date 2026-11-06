/**
 * Focused value and focus-within state shared by composite widgets.
 *
 * `hasFocus` is only meaningful for widgets that track focus-within; the
 * focused value is tracked for all of them.
 */
export class FocusState {
  private focused?: string;
  private focusVisible?: string;
  private within = false;

  get focusedValue(): string | undefined {
    return this.focused;
  }

  /** The focused value when focus came from the keyboard, if tracked. */
  get focusVisibleValue(): string | undefined {
    return this.focusVisible;
  }

  get hasFocus(): boolean {
    return this.within;
  }

  /** Records focus. Returns whether the state changed. */
  focus(value: string, within = false, focusVisible = false): boolean {
    const visible = focusVisible ? value : undefined;
    if (this.focused === value && this.within === within && this.focusVisible === visible) {
      return false;
    }
    this.focused = value;
    this.within = within;
    this.focusVisible = visible;
    return true;
  }

  /** Clears focus. Returns whether the state changed. */
  blur(): boolean {
    if (this.focused === undefined && this.focusVisible === undefined && !this.within) {
      return false;
    }
    this.focused = undefined;
    this.focusVisible = undefined;
    this.within = false;
    return true;
  }

  /** Restores an initial focused value without marking focus-within. */
  reset(value?: string): void {
    this.focused = value;
    this.focusVisible = undefined;
    this.within = false;
  }
}

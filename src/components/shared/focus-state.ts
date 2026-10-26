/**
 * Focused value and focus-within state shared by composite widgets.
 *
 * `hasFocus` is only meaningful for widgets that track focus-within; the
 * focused value is tracked for all of them.
 */
export class FocusState {
  private focused?: string;
  private within = false;

  public get focusedValue(): string | undefined {
    return this.focused;
  }

  public get hasFocus(): boolean {
    return this.within;
  }

  /** Records focus. Returns whether the state changed. */
  public focus(value: string, within = false): boolean {
    if (this.focused === value && this.within === within) {
      return false;
    }
    this.focused = value;
    this.within = within;
    return true;
  }

  /** Clears focus. Returns whether the state changed. */
  public blur(): boolean {
    if (this.focused === undefined && !this.within) {
      return false;
    }
    this.focused = undefined;
    this.within = false;
    return true;
  }

  /** Restores an initial focused value without marking focus-within. */
  public reset(value?: string): void {
    this.focused = value;
    this.within = false;
  }
}

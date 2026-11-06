/** A focusable control registered with a field. */
export interface FieldControlHandle {
  /** Focus the control's internal focusable element. */
  focus: (options?: FocusOptions) => void;
  /** Activate the control, when a label click should behave like a click. */
  click?: () => void;
}

function removeItem<TValue>(items: TValue[], entry: TValue): void {
  const index = items.indexOf(entry);
  if (index !== -1) {
    items.splice(index, 1);
  }
}

/**
 * Tracks the host elements of a field's parts and the internal control so the
 * field can target hosts with ARIA and route label clicks to the control.
 *
 * Registration is DOM-free; the field provider owns notification.
 */
export class FieldPartRegistry {
  private readonly labelHosts: HTMLElement[] = [];
  private readonly helperHosts: HTMLElement[] = [];
  private readonly errorHosts: HTMLElement[] = [];
  private readonly controls: FieldControlHandle[] = [];

  get labelHost(): HTMLElement | undefined {
    return this.labelHosts[0];
  }

  get helperTextHosts(): readonly HTMLElement[] {
    return this.helperHosts;
  }

  get errorTextHosts(): readonly HTMLElement[] {
    return this.errorHosts;
  }

  /** Register a mounted label host. Returns an unregister function. */
  registerLabel(host: HTMLElement): () => void {
    this.labelHosts.push(host);
    return () => {
      removeItem(this.labelHosts, host);
    };
  }

  /** Register a mounted helper-text host. Returns an unregister function. */
  registerHelperText(host: HTMLElement): () => void {
    this.helperHosts.push(host);
    return () => {
      removeItem(this.helperHosts, host);
    };
  }

  /** Register a mounted error-text host. Returns an unregister function. */
  registerErrorText(host: HTMLElement): () => void {
    this.errorHosts.push(host);
    return () => {
      removeItem(this.errorHosts, host);
    };
  }

  /** Register the internal control. Returns an unregister function. */
  registerControl(control: FieldControlHandle): () => void {
    this.controls.push(control);
    return () => {
      removeItem(this.controls, control);
    };
  }

  /** Focus the first registered control. */
  focusControl(options?: FocusOptions): void {
    this.controls.at(0)?.focus(options);
  }

  /** Click the first registered control, falling back to focus. */
  clickControl(): void {
    const control = this.controls.at(0);
    if (control === undefined) {
      return;
    }
    if (control.click === undefined) {
      control.focus();
    } else {
      control.click();
    }
  }
}

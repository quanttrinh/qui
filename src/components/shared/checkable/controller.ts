import { type ReactiveController } from "../reactive-control/controller";
import { type CheckedState } from "./checked-state";

interface CheckableControllerOptions {
  getChecked: () => CheckedState | undefined;
  getDefaultChecked: () => CheckedState | undefined;
  /** A prop-level indeterminate override, used by the checkbox. */
  getIndeterminate?: () => boolean;
  isDisabled: () => boolean;
  isReadOnly: () => boolean;
  onChange: (checked: CheckedState) => void;
  requestUpdate: () => void;
}

/** The `data-state` value for a checkable control. */
export type CheckableState = "checked" | "unchecked" | "indeterminate";

/**
 * Checked state, input synchronization, and focus-visible tracking shared by
 * checkbox and switch. The host owns the form and field integration.
 */
export class CheckableController implements ReactiveController {
  private readonly options: CheckableControllerOptions;
  private current: CheckedState = false;
  private initial: CheckedState = false;
  private input?: HTMLInputElement;
  private listening = false;
  private focused = false;
  private focusVisible = false;

  constructor(options: CheckableControllerOptions) {
    this.options = options;
  }

  /** The effective checked state, including controlled props and indeterminate. */
  public get checked(): CheckedState {
    if (this.options.getIndeterminate?.() === true) {
      return "indeterminate";
    }
    return this.options.getChecked() ?? this.current;
  }

  public get state(): CheckableState {
    if (this.checked === "indeterminate") {
      return "indeterminate";
    }
    return this.isChecked ? "checked" : "unchecked";
  }

  public get isChecked(): boolean {
    return this.checked === true;
  }

  public get isIndeterminate(): boolean {
    return this.checked === "indeterminate";
  }

  public get hasFocus(): boolean {
    return this.focused;
  }

  public get hasFocusVisible(): boolean {
    return this.focusVisible;
  }

  public get initialChecked(): CheckedState {
    return this.initial;
  }

  public hostWillLoad(): void {
    const initial = this.options.getDefaultChecked() ?? this.options.getChecked() ?? false;
    this.initial = initial;
    this.current = initial;
  }

  public hostDidRender(): void {
    this.syncInput();
  }

  public hostDisconnected(): void {
    this.removeInputListeners();
    this.focused = false;
    this.focusVisible = false;
  }

  /** Attach the native input and observe its focus and change events. */
  public setInput(input: HTMLInputElement | undefined): void {
    if (this.input !== input) {
      this.removeInputListeners();
      this.input = input;
    }
    if (input === undefined || this.listening) {
      this.syncInput();
      return;
    }
    input.addEventListener("change", this.handleChange);
    input.addEventListener("focus", this.handleFocus);
    input.addEventListener("blur", this.handleBlur);
    this.listening = true;
    this.syncInput();
  }

  public toggle(): void {
    const { checked } = this;
    this.setChecked(checked === "indeterminate" ? true : !checked);
  }

  public setChecked(checked: CheckedState): void {
    if (this.options.isDisabled() || this.options.isReadOnly()) {
      this.syncInput();
      return;
    }
    this.current = checked;
    this.options.onChange(checked);
    this.options.requestUpdate();
  }

  public reset(): void {
    this.current = this.initial;
    this.options.requestUpdate();
  }

  public restore(checked: CheckedState): void {
    this.current = checked;
    this.options.requestUpdate();
  }

  /** Push the effective state into the native input. */
  public syncInput(): void {
    const { input } = this;
    if (input === undefined) {
      return;
    }
    const { checked } = this;
    input.checked = checked === true;
    input.indeterminate = checked === "indeterminate";
  }

  private readonly handleChange = (): void => {
    if (this.options.isDisabled() || this.options.isReadOnly()) {
      this.syncInput();
      return;
    }
    this.toggle();
  };

  private readonly handleFocus = (): void => {
    const focusVisible = this.input?.matches(":focus-visible") ?? false;
    if (this.focused && this.focusVisible === focusVisible) {
      return;
    }
    this.focused = true;
    this.focusVisible = focusVisible;
    this.options.requestUpdate();
  };

  private readonly handleBlur = (): void => {
    if (!this.focused && !this.focusVisible) {
      return;
    }
    this.focused = false;
    this.focusVisible = false;
    this.options.requestUpdate();
  };

  private removeInputListeners(): void {
    const { input } = this;
    if (input === undefined || !this.listening) {
      return;
    }
    input.removeEventListener("change", this.handleChange);
    input.removeEventListener("focus", this.handleFocus);
    input.removeEventListener("blur", this.handleBlur);
    this.listening = false;
  }
}

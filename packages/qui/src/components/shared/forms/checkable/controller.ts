import { ControlledControllerBase } from "../../controllers/controlled-controller";
import { type ReactiveControllerHost } from "../../controllers/reactive-control/controller";
import { type CheckedState } from "./checked-state";

interface CheckableControllerOptions {
  getChecked: () => CheckedState | undefined;
  getDefaultChecked: () => CheckedState | undefined;
  /** A prop-level indeterminate override, used by the checkbox. */
  getIndeterminate?: () => boolean;
  isDisabled: () => boolean;
  isReadOnly: () => boolean;
  onChange: (checked: CheckedState) => void;
}

/** The `data-state` value for a checkable control. */
export type CheckableState = "checked" | "unchecked" | "indeterminate";

/**
 * Checked state, input synchronization, and focus-visible tracking shared by
 * checkbox and switch. The host owns the form and field integration.
 */
export class CheckableController extends ControlledControllerBase<CheckedState> {
  private readonly options: CheckableControllerOptions;
  private input?: HTMLInputElement;
  private listening = false;
  private focused = false;
  private focusVisible = false;

  constructor(host: ReactiveControllerHost, options: CheckableControllerOptions) {
    super(host, {
      getValue: options.getChecked,
      getDefaultValue: options.getDefaultChecked,
      getFallback: () => false,
      onChange: options.onChange,
    });
    this.options = options;
  }

  /** The effective checked state, including controlled props and indeterminate. */
  get checked(): CheckedState {
    if (this.options.getIndeterminate?.()) {
      return "indeterminate";
    }
    return this.value;
  }

  get state(): CheckableState {
    if (this.checked === "indeterminate") {
      return "indeterminate";
    }
    return this.isChecked ? "checked" : "unchecked";
  }

  get isChecked(): boolean {
    return this.checked === true;
  }

  get isIndeterminate(): boolean {
    return this.checked === "indeterminate";
  }

  get hasFocus(): boolean {
    return this.focused;
  }

  get hasFocusVisible(): boolean {
    return this.focusVisible;
  }

  get initialChecked(): CheckedState {
    return this.initialValue;
  }

  hostDidRender(): void {
    this.syncInput();
  }

  hostDisconnected(): void {
    this.removeInputListeners();
    this.focused = false;
    this.focusVisible = false;
  }

  /** Attach the native input and observe its focus and change events. */
  setInput(input: HTMLInputElement | undefined): void {
    if (this.input !== input) {
      this.removeInputListeners();
      this.input = input;
    }
    if (!input || this.listening) {
      this.syncInput();
      return;
    }
    input.addEventListener("change", this.handleChange);
    input.addEventListener("focus", this.handleFocus);
    input.addEventListener("blur", this.handleBlur);
    this.listening = true;
    this.syncInput();
  }

  toggle(): void {
    const { checked } = this;
    this.setChecked(checked === "indeterminate" ? true : !checked);
  }

  setChecked(checked: CheckedState): void {
    if (this.options.isDisabled() || this.options.isReadOnly()) {
      this.syncInput();
      return;
    }
    this.commit(checked);
  }

  /** Push the effective state into the native input. */
  syncInput(): void {
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
    this.requestUpdate();
  };

  private readonly handleBlur = (): void => {
    if (!this.focused && !this.focusVisible) {
      return;
    }
    this.focused = false;
    this.focusVisible = false;
    this.requestUpdate();
  };

  private removeInputListeners(): void {
    const { input } = this;
    if (!input || !this.listening) {
      return;
    }
    input.removeEventListener("change", this.handleChange);
    input.removeEventListener("focus", this.handleFocus);
    input.removeEventListener("blur", this.handleBlur);
    this.listening = false;
  }
}

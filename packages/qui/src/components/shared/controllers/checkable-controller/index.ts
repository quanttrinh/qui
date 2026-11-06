import { ControlledControllerBase } from "../controlled-controller";
import { type ReactiveControllerHost } from "../reactive-controller";

/** The checked state shared by checkbox-like controls. */
export type CheckedState = boolean | "indeterminate";

interface CheckableControllerOptions {
  /** The controlled value, normalized from attributes and properties. */
  getChecked: () => unknown;
  /** The initial value, normalized from attributes and properties. */
  getDefaultChecked: () => unknown;
  /** A prop-level indeterminate override, used by the checkbox. */
  getIndeterminate?: () => boolean;
  /** Whether the control supports the indeterminate state. Defaults to `true`. */
  supportsIndeterminate?: boolean;
  isDisabled: () => boolean;
  isReadOnly: () => boolean;
  onChange: (checked: CheckedState) => void;
}

/** Normalize a Stencil attribute/property value into a checked state. */
function normalizeChecked(value: unknown, supportsIndeterminate = true): CheckedState | undefined {
  if (value === "indeterminate") {
    return supportsIndeterminate ? "indeterminate" : undefined;
  }
  if (value === "" || value === "true" || value === true) {
    return true;
  }
  if (value === "false" || value === false) {
    return false;
  }
  return undefined;
}

/** The `data-state` value for a checkable control. */
export type CheckableState = "checked" | "unchecked" | "indeterminate";

/**
 * Checked state, input synchronization, and focus-visible tracking shared by
 * checkbox and switch. The host owns the form and field integration.
 */
export class CheckableController extends ControlledControllerBase<CheckedState> {
  private readonly options: CheckableControllerOptions;
  private readonly supportsIndeterminate: boolean;
  private input?: HTMLInputElement;
  private listening = false;
  private focused = false;
  private focusVisible = false;

  constructor(host: ReactiveControllerHost, options: CheckableControllerOptions) {
    const supportsIndeterminate = options.supportsIndeterminate !== false;
    super(host, {
      getValue: (): CheckedState | undefined =>
        normalizeChecked(options.getChecked(), supportsIndeterminate),
      getDefaultValue: (): CheckedState | undefined =>
        normalizeChecked(options.getDefaultChecked(), supportsIndeterminate),
      getFallback: () => false,
      onChange: options.onChange,
    });
    this.options = options;
    this.supportsIndeterminate = supportsIndeterminate;
  }

  /** Normalize a property, attribute, or form value into a checked state. */
  normalize(value: unknown): CheckedState | undefined {
    return normalizeChecked(value, this.supportsIndeterminate);
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

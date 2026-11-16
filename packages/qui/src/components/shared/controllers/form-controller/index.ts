import { Build } from "@stencil/core";

import { fieldContext, type FieldApi } from "../../helpers/field/context";
import { type FieldControlHandle } from "../../helpers/field/registry";
import { ReactiveControllerBase, type ReactiveControllerHost } from "../reactive-controller";

export interface FormValidity {
  flags: ValidityStateFlags;
  message?: string;
  element?: HTMLElement;
}

export interface FormControllerOptions {
  getInternals: () => ElementInternals;
  getName: () => string | undefined;
  getMultiple: () => boolean;
  getValue: () => readonly string[];
  getDisabled: () => boolean;
  getReadOnly: () => boolean;
  getRequired: () => boolean;
  getInvalid: () => boolean;
  /** Validation anchor; must be focusable so `reportValidity()` can focus it. */
  getValidationElement: () => HTMLElement | undefined;
  /** Resets the component-owned value state. */
  onReset: () => void;
  /** Applies values restored from form state. */
  onRestore: (values: string[]) => void;
  /** Called when field/disabled state changes, e.g. to refresh machine props. */
  onChange?: () => void;
  /** Overrides the default string/FormData value for the form. */
  getFormValue?: () => string | File | FormData | null;
  /** Overrides the default required/invalid validity rules. */
  getValidity?: () => FormValidity;
}

function parseRestoredValues(state: string | File | FormData | null): string[] | undefined {
  if (typeof state !== "string") {
    return undefined;
  }
  try {
    const value: unknown = JSON.parse(state);
    return Array.isArray(value) ? value.map(String) : undefined;
  } catch {
    return undefined;
  }
}

/** `ElementInternals.setFormValue()` uses null to clear the value. */
function clearedFormValue(): string | File | FormData | null {
  return null;
}

function formValue(
  name: string | undefined,
  multiple: boolean,
  values: readonly string[],
): string | FormData {
  if (!multiple) {
    return values[0] ?? "";
  }
  const data = new FormData();
  if (name !== undefined) {
    for (const value of values) {
      data.append(name, value);
    }
  }
  return data;
}

/**
 * Form/field behaviour shared by every form-associated control: `qui-field`
 * integration, form value, validity, reset, and state restoration.
 */
export class FormController extends ReactiveControllerBase {
  private readonly options: FormControllerOptions;
  private field?: FieldApi;
  private loaded = false;
  private control?: FieldControlHandle;
  private unregisterControl?: () => void;
  private unsubscribe?: () => void;
  private stopListening?: () => void;
  private formDisabled = false;

  constructor(host: ReactiveControllerHost, options: FormControllerOptions) {
    super(host);
    this.options = options;
  }

  get fieldApi(): FieldApi | undefined {
    return this.field;
  }

  get isDisabled(): boolean {
    return this.formDisabled || (this.field?.disabled() ?? this.options.getDisabled());
  }

  get isReadOnly(): boolean {
    return this.field?.readOnly() ?? this.options.getReadOnly();
  }

  get isRequired(): boolean {
    return this.field?.required() ?? this.options.getRequired();
  }

  get isInvalid(): boolean {
    return this.field?.invalid() ?? this.options.getInvalid();
  }

  /**
   * Registers the internal focusable control with the current field, or clears
   * it when passed `undefined`. Label clicks use the registered handle.
   */
  setControl(control: FieldControlHandle | undefined): void {
    this.control = control;
    this.registerControl();
  }

  setDisabled(disabled: boolean): void {
    this.formDisabled = disabled;
    this.options.onChange?.();
    this.requestUpdate();
    this.sync();
  }

  reset(): void {
    this.options.onReset();
    this.sync();
  }

  restore(state: string | File | FormData | null): void {
    const values = parseRestoredValues(state);
    if (values === undefined) {
      return;
    }
    this.options.onRestore(values);
    this.sync();
  }

  sync(): void {
    if (Build.isServer) {
      return;
    }
    const internals = this.options.getInternals();
    const value = this.isDisabled
      ? clearedFormValue()
      : (this.options.getFormValue?.() ??
        formValue(this.options.getName(), this.options.getMultiple(), this.options.getValue()));
    internals.setFormValue(value, JSON.stringify(this.options.getValue()));
    const validity = this.isDisabled
      ? { flags: {} }
      : (this.options.getValidity?.() ?? this.validity());
    internals.setValidity(validity.flags, validity.message, validity.element);
  }

  hostConnected(): void {
    this.listenForField();
    const attached = this.attach();
    if (attached && this.loaded) {
      this.requestUpdate();
    }
  }

  hostWillLoad(): void {
    this.listenForField();
    this.attach();
  }

  hostDidLoad(): void {
    this.loaded = true;
    this.attach();
    this.sync();
  }

  hostDidRender(): void {
    this.sync();
  }

  hostDisconnected(): void {
    this.stopListening?.();
    this.stopListening = undefined;
    this.unregisterControl?.();
    this.unregisterControl = undefined;
    this.unsubscribe?.();
    this.unsubscribe = undefined;
    this.field = undefined;
  }

  private listenForField(): void {
    this.stopListening ??= fieldContext.onProvided(this.hostElement, () => {
      if (this.attach()) {
        this.options.onChange?.();
        this.requestUpdate();
      }
    });
  }

  private attach(): boolean {
    const field = fieldContext.consume(this.hostElement);
    if (field === this.field) {
      return false;
    }
    this.unsubscribe?.();
    this.unsubscribe = undefined;
    this.field = field;
    this.registerControl();
    if (field !== undefined) {
      this.unsubscribe = field.subscribe(() => {
        this.options.onChange?.();
        this.requestUpdate();
        this.sync();
      });
    }
    this.sync();
    return true;
  }

  private registerControl(): void {
    this.unregisterControl?.();
    this.unregisterControl = undefined;
    if (this.field !== undefined && this.control !== undefined) {
      this.unregisterControl = this.field.registerControl(this.control);
    }
  }

  private validity(): FormValidity {
    if (this.isDisabled) {
      return { flags: {} };
    }
    const values = this.options.getValue();
    if (this.isRequired && values.length === 0) {
      return {
        flags: { valueMissing: true },
        message: "Please select an option.",
        element: this.options.getValidationElement(),
      };
    }
    if (this.isInvalid) {
      return {
        flags: { customError: true },
        message: "Invalid value",
        element: this.options.getValidationElement(),
      };
    }
    return { flags: {} };
  }
}

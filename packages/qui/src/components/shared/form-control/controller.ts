import { Build } from "@stencil/core";

import { onContextProvided } from "../context-part";
import { consumeField, type FieldApi } from "../field/context";
import { type FieldControlHandle } from "../field/registry";
import { type ReactiveController } from "../reactive-control/controller";
import { type FormControl } from "./component-base";

export interface FormValidity {
  flags: ValidityStateFlags;
  message?: string;
  element?: HTMLElement;
}

export interface FormControllerOptions {
  getHost: () => HTMLElement;
  getInternals: () => ElementInternals;
  getName: () => string | undefined;
  getMultiple: () => boolean;
  getValue: () => readonly string[];
  getDisabled: () => boolean;
  getReadOnly: () => boolean;
  getRequired: () => boolean;
  getInvalid: () => boolean;
  getValidationElement: () => HTMLElement | undefined;
  /** Resets the component-owned value state. */
  onReset: () => void;
  /** Applies values restored from form state. */
  onRestore: (values: string[]) => void;
  requestUpdate: () => void;
  /** Called when field/disabled state changes, e.g. to refresh machine props. */
  onChange?: () => void;
  /** Overrides the default string/FormData value for the form. */
  getFormValue?: () => string | File | FormData | null;
  /** Overrides the default required/invalid validity rules. */
  getValidity?: () => FormValidity;
  /** Overrides the default value/name/multiple signature. */
  getSignature?: () => string;
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
  // oxlint-disable-next-line unicorn/no-null
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

interface FormSignatureOptions {
  name: string | undefined;
  multiple: boolean;
  disabled: boolean;
  required: boolean;
  invalid: boolean;
  values: readonly string[];
}

function formSignature({
  name,
  multiple,
  disabled,
  required,
  invalid,
  values,
}: FormSignatureOptions): string {
  return `${name ?? ""}\u0001${multiple}\u0001${disabled}\u0001${required}\u0001${invalid}\u0001${values.join("\u0000")}`;
}

/**
 * Form/field behaviour shared by every form-associated control: `qui-field`
 * integration, form value, validity, reset, and state restoration.
 */
export class FormController implements FormControl, ReactiveController {
  private readonly options: FormControllerOptions;
  private field?: FieldApi;
  private control?: FieldControlHandle;
  private unregisterControl?: () => void;
  private unsubscribe?: () => void;
  private stopListening?: () => void;
  private formDisabled = false;
  private signature = "";

  constructor(options: FormControllerOptions) {
    this.options = options;
  }

  public get fieldApi(): FieldApi | undefined {
    return this.field;
  }

  public get isDisabled(): boolean {
    return this.formDisabled || (this.field?.disabled() ?? this.options.getDisabled());
  }

  public get isReadOnly(): boolean {
    return this.field?.readOnly() ?? this.options.getReadOnly();
  }

  public get isRequired(): boolean {
    return this.field?.required() ?? this.options.getRequired();
  }

  public get isInvalid(): boolean {
    return this.field?.invalid() ?? this.options.getInvalid();
  }

  /**
   * Registers the internal focusable control with the current field, or clears
   * it when passed `undefined`. Label clicks use the registered handle.
   */
  public setControl(control: FieldControlHandle | undefined): void {
    this.control = control;
    this.registerControl();
  }

  public setDisabled(disabled: boolean): void {
    this.formDisabled = disabled;
    this.options.onChange?.();
    this.options.requestUpdate();
    this.sync();
  }

  public reset(): void {
    this.signature = "";
    this.options.onReset();
    this.sync();
  }

  public restore(state: string | File | FormData | null): void {
    const values = parseRestoredValues(state);
    if (values === undefined) {
      return;
    }
    this.signature = "";
    this.options.onRestore(values);
    this.sync();
  }

  public sync(): void {
    if (Build.isServer) {
      return;
    }
    // Always include controller-owned state.
    // Components with a custom signature for native validity still need
    // Disabled/read-only changes to invalidate the cached form value.
    const signature = `${this.options.getSignature?.() ?? this.signatureFor()}\u0001${
      this.isDisabled ? 1 : 0
    }\u0001${this.isReadOnly ? 1 : 0}\u0001${this.isRequired ? 1 : 0}\u0001${this.isInvalid ? 1 : 0}`;
    if (signature === this.signature) {
      return;
    }
    this.signature = signature;
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

  public hostConnected(): void {
    this.listenForField();
    this.attach();
  }

  public hostWillLoad(): void {
    this.listenForField();
    this.attach();
  }

  public hostDidLoad(): void {
    this.attach();
    this.sync();
  }

  public hostDidRender(): void {
    this.sync();
  }

  public hostDisconnected(): void {
    this.stopListening?.();
    this.stopListening = undefined;
    this.unregisterControl?.();
    this.unregisterControl = undefined;
    this.unsubscribe?.();
    this.unsubscribe = undefined;
    this.field = undefined;
  }

  private listenForField(): void {
    this.stopListening ??= onContextProvided("field", () => {
      if (this.attach()) {
        this.options.onChange?.();
        this.options.requestUpdate();
      }
    });
  }

  private attach(): boolean {
    const field = consumeField(this.options.getHost());
    if (field === this.field) {
      return false;
    }
    this.unsubscribe?.();
    this.unsubscribe = undefined;
    this.field = field;
    this.signature = "";
    this.registerControl();
    if (field !== undefined) {
      this.unsubscribe = field.subscribe(() => {
        this.signature = "";
        this.options.onChange?.();
        this.options.requestUpdate();
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

  private signatureFor(): string {
    return formSignature({
      name: this.options.getName(),
      multiple: this.options.getMultiple(),
      disabled: this.isDisabled,
      required: this.isRequired,
      invalid: this.isInvalid,
      values: this.options.getValue(),
    });
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

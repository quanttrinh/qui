import { Build } from "@stencil/core";

import { shallowEqual } from "../../helpers/equality";
import { fieldContext, type FieldApi } from "../../helpers/field/context";
import { type FieldControlHandle } from "../../helpers/field/registry";
import { ReactiveControllerBase, type ReactiveControllerHost } from "../reactive-controller";

export interface FormValidity {
  flags: ValidityStateFlags;
  message?: string;
  element?: HTMLElement;
}

/** The current form value and its focusable validation anchor. */
export interface FormState {
  name: string | undefined;
  multiple: boolean;
  values: readonly string[];
  /** Overrides the derived submit value, e.g. null for an unchecked checkbox. */
  formValue?: string | File | FormData | null;
  validationElement?: HTMLElement | undefined;
}

/** Field-resolved control state passed to custom validity builders. */
export interface ResolvedFormState {
  disabled: boolean;
  readOnly: boolean;
  required: boolean;
  invalid: boolean;
}

export interface FormControllerOptions {
  internals: () => ElementInternals;
  /** Current value and validation anchor. */
  state: () => FormState;
  /** Resolved field flags for custom validity builders. */
  validity?: (state: ResolvedFormState, form: FormState) => FormValidity;
  disabled: () => boolean;
  readOnly: () => boolean;
  required: () => boolean;
  invalid: () => boolean;
  /** Resets the component-owned value state. */
  onReset: () => void;
  /** Applies values restored from form state. */
  onRestore: (values: readonly string[]) => void;
  /** Called when field/disabled state changes, e.g. to refresh machine props. */
  onChange?: () => void;
}

/** `ElementInternals.setFormValue()` uses null to clear the value. */
function clearedFormValue(): string | File | FormData | null {
  return null;
}

/** Reads the restore state written by `setFormValue()`. */
function parseRestoredValues(state: string | File | FormData | null): string[] | undefined {
  if (typeof state === "string") {
    return [state];
  }
  if (state instanceof FormData) {
    return [...state.values()].map((value) => (typeof value === "string" ? value : value.name));
  }
  return undefined;
}

function resolveFormValue(state: FormState): string | File | FormData | null {
  if (state.formValue !== undefined) {
    return state.formValue;
  }
  if (!state.multiple) {
    return state.values[0] ?? "";
  }
  const data = new FormData();
  if (state.name !== undefined) {
    for (const value of state.values) {
      data.append(state.name, value);
    }
  }
  return data;
}

function defaultValidity(state: ResolvedFormState, form: FormState): FormValidity {
  if (state.required && form.values.length === 0) {
    return {
      flags: { valueMissing: true },
      message: "Please select an option.",
      element: form.validationElement,
    };
  }
  if (state.invalid) {
    return {
      flags: { customError: true },
      message: "Invalid value",
      element: form.validationElement,
    };
  }
  return { flags: {} };
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
  private appliedValueKey?: readonly (string | boolean | undefined)[];

  constructor(host: ReactiveControllerHost, options: FormControllerOptions) {
    super(host);
    this.options = options;
  }

  get fieldApi(): FieldApi | undefined {
    return this.field;
  }

  get isDisabled(): boolean {
    return this.formDisabled || (this.field?.disabled() ?? this.options.disabled());
  }

  get isReadOnly(): boolean {
    return this.field?.readOnly() ?? this.options.readOnly();
  }

  get isRequired(): boolean {
    return this.field?.required() ?? this.options.required();
  }

  get isInvalid(): boolean {
    return this.field?.invalid() ?? this.options.invalid();
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
    const resolved: ResolvedFormState = {
      disabled: this.isDisabled,
      readOnly: this.isReadOnly,
      required: this.isRequired,
      invalid: this.isInvalid,
    };
    const form = this.options.state();
    const valueKey = [resolved.disabled, form.name, form.multiple, ...form.values] as const;
    const internals = this.options.internals();

    if (!shallowEqual(this.appliedValueKey, valueKey)) {
      const value = resolved.disabled ? clearedFormValue() : resolveFormValue(form);
      // The value doubles as restore state.
      // Strings stay strings; multi-value controls restore from FormData entries.
      internals.setFormValue(value, value ?? "");
      this.appliedValueKey = valueKey;
    }

    // Validity writes are cheap and idempotent, so apply them on every sync.
    // This keeps late validation anchors and native validity current.
    const validity = resolved.disabled
      ? { flags: {} }
      : (this.options.validity?.(resolved, form) ?? defaultValidity(resolved, form));
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
}

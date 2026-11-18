import { Build } from "@stencil/core";

import type { ContextCallback } from "../../context";
import type { FieldApi } from "../../helpers/field/context";
import type { FieldControlHandle } from "../../helpers/field/registry";
import type { ReactiveControllerHost } from "../reactive-controller";

import { requestContext } from "../../context";
import { shallowEqual } from "../../helpers/equality";
import { fieldContext } from "../../helpers/field/context";
import { ReactiveControllerBase } from "../reactive-controller";

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
  validationElement?: HTMLElement | undefined;
}

/** Field-resolved control state passed to custom validity builders. */
export interface ResolvedFormState {
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

/** Reads the JSON values array written by `setFormValue()`. */
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

function resolveFormValue(state: FormState): string | FormData | null {
  if (!state.multiple) {
    return state.values.length === 0 ? null : (state.values[0] ?? null);
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
  if (state.invalid) {
    return {
      flags: { customError: true },
      message: "Invalid value",
      element: form.validationElement,
    };
  }
  if (state.required && form.values.length === 0) {
    return {
      flags: { valueMissing: true },
      message: "Please select an option.",
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
  private control?: FieldControlHandle;
  private unregisterControl?: () => void;
  private unsubscribe?: () => void;
  private requested = false;
  private starting = false;
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
    const disabled = this.isDisabled;
    const resolved: ResolvedFormState = {
      required: this.isRequired,
      invalid: this.isInvalid,
    };
    const form = this.options.state();
    const valueKey = [disabled, form.name, form.multiple, ...form.values] as const;
    const internals = this.options.internals();

    if (!shallowEqual(this.appliedValueKey, valueKey)) {
      const value = disabled ? null : resolveFormValue(form);
      // Restore state is JSON so empty and missing values stay distinct.
      // This matters for empty inputs and unchecked checkboxes.
      internals.setFormValue(value, JSON.stringify(form.values));
      this.appliedValueKey = valueKey;
    }

    // Validity writes are cheap and idempotent, so apply them on every sync.
    // This keeps late validation anchors and native validity current.
    const validity = disabled
      ? { flags: {} }
      : (this.options.validity?.(resolved, form) ?? defaultValidity(resolved, form));
    internals.setValidity(validity.flags, validity.message, validity.element);
  }

  hostConnected(): void {
    this.start();
  }

  hostWillLoad(): void {
    this.start();
  }

  hostDidLoad(): void {
    this.sync();
  }

  hostDidRender(): void {
    this.sync();
  }

  hostDisconnected(): void {
    this.unregisterControl?.();
    this.unregisterControl = undefined;
    this.unsubscribe?.();
    this.unsubscribe = undefined;
    this.field = undefined;
    this.requested = false;
  }

  private start(): void {
    if (this.requested) {
      return;
    }
    this.requested = true;
    this.starting = true;
    requestContext(this.hostElement, fieldContext, this.handleField, true);
    this.starting = false;
  }

  private readonly handleField: ContextCallback<FieldApi | undefined> = (field, unsubscribe) => {
    if (unsubscribe !== this.unsubscribe) {
      this.unsubscribe?.();
      this.unsubscribe = unsubscribe;
    }
    if (!Object.is(field, this.field)) {
      this.unregisterControl?.();
      this.unregisterControl = undefined;
      this.field = field;
      this.registerControl();
    }
    this.sync();
    // The first synchronous answer during `start()` is applied silently.
    if (!this.starting) {
      this.options.onChange?.();
      this.requestUpdate();
    }
  };

  private registerControl(): void {
    this.unregisterControl?.();
    this.unregisterControl = undefined;
    if (this.field !== undefined && this.control !== undefined) {
      this.unregisterControl = this.field.registerControl(this.control);
    }
  }
}

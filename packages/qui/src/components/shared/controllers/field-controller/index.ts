import { dataAttr } from "../../helpers/aria/attr";
import { nextId } from "../../helpers/dom/id";
import {
  clearField,
  provideField,
  type FieldApi,
  type FieldIds,
} from "../../helpers/field/context";
import { FieldPartRegistry } from "../../helpers/field/registry";
import { createListenerStore } from "../listener-store";
import { ReactiveControllerBase, type ReactiveControllerHost } from "../reactive-controller";

export interface FieldControllerOptions {
  /** Base id override for the field. */
  getFieldId: () => string | undefined;
  /** Per-part id overrides. */
  getElementIds: () => Partial<FieldIds> | undefined;
  isInvalid: () => boolean;
  isDisabled: () => boolean;
  isReadOnly: () => boolean;
  isRequired: () => boolean;
}

/**
 * Owns the provider side of `qui-field`: generated ids, field state, part
 * registration, context publication, and change notification.
 */
export class FieldController extends ReactiveControllerBase {
  private readonly options: FieldControllerOptions;
  private readonly generatedId = nextId("qui-field");
  private readonly registry = new FieldPartRegistry();
  private readonly listeners = createListenerStore();
  private field?: FieldApi;
  private baseId?: string;

  constructor(host: ReactiveControllerHost, options: FieldControllerOptions) {
    super(host);
    this.options = options;
  }

  get ids(): FieldIds {
    return this.resolveIds();
  }

  /** Wakes descendants after a watched prop changes or a part registers. */
  notify(): void {
    this.listeners.notify();
  }

  hostWillLoad(): void {
    // Capture the authored id before rendering overwrites it with the root id.
    // Generated part ids then stay stable across renders.
    this.baseId = this.hostElement.id || undefined;
    this.field = this.createFieldApi();
    provideField(this.hostElement, this.field);
  }

  hostConnected(): void {
    if (this.field !== undefined) {
      provideField(this.hostElement, this.field);
    }
  }

  hostDisconnected(): void {
    clearField(this.hostElement);
  }

  private resolveIds(): FieldIds {
    const base = this.options.getFieldId() ?? this.baseId ?? this.generatedId;
    const overrides = this.options.getElementIds();
    return {
      root: overrides?.root ?? base,
      control: overrides?.control ?? `${base}::control`,
      label: overrides?.label ?? `${base}::label`,
      errorText: overrides?.errorText ?? `${base}::error-text`,
      helperText: overrides?.helperText ?? `${base}::helper-text`,
    };
  }

  private createFieldApi(): FieldApi {
    const resolveIds = (): FieldIds => this.resolveIds();
    return {
      get ids() {
        return resolveIds();
      },
      invalid: () => this.options.isInvalid(),
      disabled: () => this.options.isDisabled(),
      readOnly: () => this.options.isReadOnly(),
      required: () => this.options.isRequired(),
      getInputProps: () => {
        const ids = this.resolveIds();
        const disabled = this.options.isDisabled();
        const invalid = this.options.isInvalid();
        const readOnly = this.options.isReadOnly();
        return {
          id: ids.control,
          disabled,
          required: this.options.isRequired(),
          readOnly: readOnly || undefined,
          "aria-invalid": invalid ? "true" : undefined,
          "data-scope": "field" as const,
          "data-part": "input" as const,
          "data-invalid": dataAttr(invalid),
          "data-required": dataAttr(this.options.isRequired()),
          "data-readonly": dataAttr(readOnly),
        };
      },
      getLabelProps: () => {
        const ids = this.resolveIds();
        const disabled = this.options.isDisabled();
        const invalid = this.options.isInvalid();
        const readOnly = this.options.isReadOnly();
        return {
          id: ids.label,
          htmlFor: ids.control,
          "data-scope": "field" as const,
          "data-part": "label" as const,
          "data-disabled": dataAttr(disabled),
          "data-invalid": dataAttr(invalid),
          "data-readonly": dataAttr(readOnly),
          "data-required": dataAttr(this.options.isRequired()),
        };
      },
      getHelperTextProps: () => ({
        id: this.resolveIds().helperText,
        "data-scope": "field" as const,
        "data-part": "helper-text" as const,
        "data-disabled": dataAttr(this.options.isDisabled()),
      }),
      getErrorTextProps: () => ({
        id: this.resolveIds().errorText,
        "data-scope": "field" as const,
        "data-part": "error-text" as const,
        "aria-live": "polite" as const,
      }),
      getLabelHost: () => this.registry.labelHost,
      getHelperTextHosts: () => this.registry.helperTextHosts,
      getErrorTextHosts: () => this.registry.errorTextHosts,
      registerLabel: (host) => this.registerPart(() => this.registry.registerLabel(host)),
      registerHelperText: (host) => this.registerPart(() => this.registry.registerHelperText(host)),
      registerErrorText: (host) => this.registerPart(() => this.registry.registerErrorText(host)),
      registerControl: (control) => this.registry.registerControl(control),
      focusControl: (options) => {
        this.registry.focusControl(options);
      },
      clickControl: () => {
        this.registry.clickControl();
      },
      subscribe: this.listeners.subscribe,
    };
  }

  private registerPart(register: () => () => void): () => void {
    const teardown = register();
    this.notify();
    return () => {
      teardown();
      this.notify();
    };
  }
}

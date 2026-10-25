import { resolveVar, Component, Element, h, Host, Prop, Watch, type VNode } from "@stencil/core";

import { styleUrls } from "#qui-style-url";
import { cx } from "#styled-system/css";

import { dataAttr } from "../../helpers/attr";
import { nextId } from "../../helpers/id";
import { clearField, provideField, type FieldApi, type FieldIds } from "../shared/field/context";
import { fieldStyles } from "./styles";

/**
 * Groups a control with its label, helper text, and error text.
 *
 * Descendant `qui-input`, `qui-checkbox`, `qui-switch`, and `qui-radio-group`
 * read the field state through a DOM context instead of duplicating it.
 *
 * @slot - Field label, control, helper text, and error text.
 */
@Component({
  tag: "qui-field",
  styleUrl: resolveVar(styleUrls.quiField),
  scoped: true,
})
export class QuiField {
  @Element() host!: HTMLQuiFieldElement;

  /** Base id used to derive the field part ids. Defaults to the host id. */
  @Prop() fieldId?: string;
  /** Overrides for any of the generated part ids. Property-only. */
  @Prop() elementIds?: Partial<FieldIds>;
  /** Marks the field invalid. */
  @Prop() invalid = false;
  /** Disables the field and its controls. */
  @Prop() disabled = false;
  /** Makes the field and its controls read-only. */
  @Prop() readOnly = false;
  /** Marks the field required. */
  @Prop() required = false;
  /** Additional class applied to the root element. */
  @Prop() innerClass?: string;

  private helperCount = 0;
  private errorCount = 0;

  private readonly generatedId = nextId("qui-field");
  private readonly listeners = new Set<() => void>();
  private field?: FieldApi;

  public componentWillLoad(): void {
    this.field = this.createFieldApi();
    provideField(this.host, this.field);
  }

  public connectedCallback(): void {
    if (this.field !== undefined) {
      provideField(this.host, this.field);
    }
  }

  public disconnectedCallback(): void {
    clearField(this.host);
    this.listeners.clear();
  }

  @Watch("fieldId")
  @Watch("elementIds")
  @Watch("invalid")
  @Watch("disabled")
  @Watch("readOnly")
  @Watch("required")
  private notify(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }

  private get ids(): FieldIds {
    const base = this.fieldId ?? (this.host.id || this.generatedId);
    return {
      root: this.elementIds?.root ?? base,
      control: this.elementIds?.control ?? `${base}::control`,
      label: this.elementIds?.label ?? `${base}::label`,
      errorText: this.elementIds?.errorText ?? `${base}::error-text`,
      helperText: this.elementIds?.helperText ?? `${base}::helper-text`,
    };
  }

  private createFieldApi(): FieldApi {
    const getIds = (): FieldIds => this.ids;
    return {
      get ids() {
        return getIds();
      },
      invalid: () => this.invalid,
      disabled: () => this.disabled,
      readOnly: () => this.readOnly,
      required: () => this.required,
      getInputProps: () => {
        const ids = getIds();
        return {
          id: ids.control,
          disabled: this.disabled,
          required: this.required,
          readOnly: this.readOnly || undefined,
          "aria-invalid": this.invalid ? "true" : undefined,
          "aria-describedby": this.helperCount > 0 ? ids.helperText : undefined,
          "aria-errormessage": this.errorCount > 0 ? ids.errorText : undefined,
          "data-scope": "field" as const,
          "data-part": "input" as const,
          "data-invalid": dataAttr(this.invalid),
          "data-required": dataAttr(this.required),
          "data-readonly": dataAttr(this.readOnly),
        };
      },
      getLabelProps: () => {
        const ids = getIds();
        return {
          id: ids.label,
          htmlFor: ids.control,
          "data-scope": "field" as const,
          "data-part": "label" as const,
          "data-disabled": dataAttr(this.disabled),
          "data-invalid": dataAttr(this.invalid),
          "data-readonly": dataAttr(this.readOnly),
          "data-required": dataAttr(this.required),
        };
      },
      getHelperTextProps: () => ({
        id: getIds().helperText,
        "data-scope": "field" as const,
        "data-part": "helper-text" as const,
        "data-disabled": dataAttr(this.disabled),
      }),
      getErrorTextProps: () => ({
        id: getIds().errorText,
        "data-scope": "field" as const,
        "data-part": "error-text" as const,
        "aria-live": "polite" as const,
      }),
      registerHelperText: () => this.registerHelperText(),
      registerErrorText: () => this.registerErrorText(),
      subscribe: (listener) => {
        this.listeners.add(listener);
        return () => {
          this.listeners.delete(listener);
        };
      },
    };
  }

  private registerHelperText(): () => void {
    this.helperCount += 1;
    this.notify();
    return () => {
      this.helperCount = Math.max(0, this.helperCount - 1);
      this.notify();
    };
  }

  private registerErrorText(): () => void {
    this.errorCount += 1;
    this.notify();
    return () => {
      this.errorCount = Math.max(0, this.errorCount - 1);
      this.notify();
    };
  }

  public render(): VNode {
    return (
      <Host
        id={this.ids.root}
        data-scope="field"
        data-part="root"
        data-disabled={dataAttr(this.disabled)}
        data-invalid={dataAttr(this.invalid)}
        data-readonly={dataAttr(this.readOnly)}
        class={cx(fieldStyles.root, this.innerClass)}
      >
        <slot />
      </Host>
    );
  }
}

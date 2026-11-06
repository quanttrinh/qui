import {
  Mixin,
  resolveVar,
  AttachInternals,
  Component,
  Element,
  Event,
  h,
  Host,
  Method,
  Prop,
  Watch,
  type EventEmitter,
  type VNode,
} from "@stencil/core";

import { styleUrls } from "#qui-style-url";
import { css } from "#styled-system/css";

import { ensureShadowStylesheet } from "../../utilities/styles";
import { CheckIcon, RemoveIcon } from "../qui-icon/icons";
import {
  CheckableController,
  FormController,
  type CheckedState,
  type FormValidity,
} from "../shared/controllers";
import { dataAttr } from "../shared/helpers/aria/attr";
import { focusElement } from "../shared/helpers/dom/focus";
import { nextId } from "../shared/helpers/dom/id";
import { applyFieldAria, createFieldControl } from "../shared/helpers/field";
import { ControllerHostMixin, FormControlMixin } from "../shared/mixins";
import { focusRing, requiredIndicatorStyle } from "../shared/styles";

const styles = {
  host: css({ display: "inline-flex" }),
  root: css({
    display: "inline-flex",
    alignItems: "center",
    gap: "2",
    minH: "11",
    cursor: "pointer",
    userSelect: "none",
    "&[data-disabled]": { cursor: "not-allowed", opacity: 0.38 },
  }),
  control: css({
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    w: "5",
    h: "5",
    rounded: "sm",
    borderWidth: "0.5",
    borderStyle: "solid",
    borderColor: "outline",
    color: "transparent",
    bgColor: "transparent",
    transition: "background-color 150ms, border-color 150ms, color 150ms",
    "&:hover": { borderColor: "onSurface" },
    "&[data-state=checked], &[data-state=indeterminate]": {
      borderColor: "primary",
      bgColor: "primary",
      color: "onPrimary",
    },
    "&[data-invalid]": { borderColor: "error" },
    "&[data-focus-visible]": focusRing,
  }),
  indicator: css({
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    textStyle: "sm",
    lineHeight: "none",
  }),
  label: css({
    cursor: "pointer",
    textStyle: "sm",
    fontWeight: "medium",
    color: "onSurface",
  }),
  input: css({
    pos: "absolute",
    w: "1px",
    h: "1px",
    p: "0",
    overflow: "hidden",
    clip: "rect(0, 0, 0, 0)",
    whiteSpace: "nowrap",
    borderWidth: "0",
  }),
};

/**
 * MD3 checkbox.
 *
 * @slot - Label content. Falls back to the `label` prop.
 */
@Component({
  tag: "qui-checkbox",
  styleUrl: resolveVar(styleUrls.quiCheckbox),
  shadow: true,
  formAssociated: true,
})
export class QuiCheckbox extends Mixin(ControllerHostMixin, FormControlMixin) {
  @Element() host!: HTMLQuiCheckboxElement;
  @AttachInternals() internals!: ElementInternals;

  /** The controlled checked state. Leave unset for an uncontrolled checkbox. */
  @Prop({ mutable: true }) checked?: CheckedState;
  /** The initial checked state for an uncontrolled checkbox. */
  @Prop() defaultChecked?: CheckedState;
  /** Renders the indeterminate state instead of checked/unchecked. */
  @Prop() indeterminate = false;
  /** Disables the control. */
  @Prop() disabled = false;
  /** Marks the control invalid. */
  @Prop() invalid = false;
  /** Marks the control required. */
  @Prop() required = false;
  /** Makes the control read-only. */
  @Prop() readOnly = false;
  /** The form field name. */
  @Prop() name?: string;
  /** The form field value. */
  @Prop() value?: string;
  /** Plain-text label fallback when no slot content is supplied. */
  @Prop() label?: string;

  /** Emitted whenever the checked state changes. */
  @Event({ eventName: "checkedchange", bubbles: true, composed: true })
  checkedChange!: EventEmitter<{ checked: CheckedState }>;

  private inputEl?: HTMLInputElement;
  private labelEl?: HTMLElement;
  private readonly defaultMarker = "*";
  private readonly generatedId = nextId("qui-checkbox");
  private readonly fieldControl = createFieldControl(() => this.inputEl, {
    activateOnLabel: true,
  });
  private readonly checkable = new CheckableController(this, {
    getChecked: (): CheckedState | undefined => this.checked,
    getDefaultChecked: (): CheckedState | undefined => this.defaultChecked,
    getIndeterminate: (): boolean => this.indeterminate,
    isDisabled: (): boolean => this.form.isDisabled,
    isReadOnly: (): boolean => this.form.isReadOnly,
    onChange: (checked: CheckedState): void => {
      this.checkedChange.emit({ checked });
      this.form.sync();
    },
  });
  protected readonly form = new FormController(this, {
    getInternals: (): ElementInternals => this.internals,
    getName: (): string | undefined => this.name,
    getMultiple: (): boolean => false,
    getValue: (): readonly string[] => (this.checkable.isChecked ? [this.value ?? "on"] : []),
    getDisabled: (): boolean => this.disabled,
    getReadOnly: (): boolean => this.readOnly,
    getRequired: (): boolean => this.required,
    getInvalid: (): boolean => this.invalid,
    getValidationElement: (): HTMLElement | undefined => this.inputEl,
    getFormValue: (): string | null => (this.checkable.isChecked ? (this.value ?? "on") : null),
    getValidity: (): FormValidity => this.validity(),
    getSignature: (): string => this.signature(),
    onReset: (): void => {
      this.checked = this.checkable.initialChecked;
      this.checkable.reset();
    },
    onRestore: (values: string[]): void => {
      const checked = this.checkable.normalize(values.at(0)) ?? false;
      this.checked = checked;
      this.checkable.restore(checked);
    },
  });

  constructor() {
    super();
    this.form.setControl(this.fieldControl);
  }

  connectedCallback(): void {
    super.connectedCallback();
    this.checkable.setInput(this.inputEl);
    ensureShadowStylesheet(this.host);
  }

  componentDidRender(): void {
    super.componentDidRender();
    applyFieldAria(this.inputEl, this.form.fieldApi, {
      labelledBy: this.labelEl === undefined ? [] : [this.labelEl],
    });
  }

  /** Moves focus to the internal native input. */
  @Method()
  async focusControl(options?: FocusOptions): Promise<void> {
    await focusElement(this.inputEl, options);
  }

  @Watch("checked")
  @Watch("indeterminate")
  @Watch("disabled")
  @Watch("invalid")
  @Watch("required")
  @Watch("readOnly")
  @Watch("name")
  @Watch("value")
  private syncForm(): void {
    this.form.sync();
  }

  private get rootId(): string {
    return `checkbox:${this.host.id || this.generatedId}`;
  }

  private get labelId(): string {
    return `${this.rootId}:label`;
  }

  private get inputId(): string {
    return this.form.fieldApi?.ids.control ?? `${this.rootId}:input`;
  }

  private get controlId(): string {
    return `${this.rootId}:control`;
  }

  private get inputProps(): Record<string, string | number | boolean | undefined> {
    const field = this.form.fieldApi;
    const props: Record<string, string | number | boolean | undefined> =
      field === undefined
        ? {
            id: this.inputId,
            disabled: this.form.isDisabled,
            "aria-invalid": this.form.isInvalid ? "true" : "false",
            "data-scope": "checkbox",
            "data-part": "input",
            "data-invalid": dataAttr(this.form.isInvalid),
            "data-required": dataAttr(this.form.isRequired),
            "data-readonly": dataAttr(this.form.isReadOnly),
          }
        : { ...field.getInputProps() };
    delete props.required;
    if (this.form.isRequired) {
      props["aria-required"] = "true";
    }
    return props;
  }

  private validity(): FormValidity {
    if (this.form.isRequired && !this.checkable.isChecked) {
      return {
        flags: { valueMissing: true },
        message: "Please check this box if you want to proceed.",
        element: this.inputEl,
      };
    }
    if (this.form.isInvalid) {
      return {
        flags: { customError: true },
        message: "Invalid value",
        element: this.inputEl,
      };
    }
    return { flags: {} };
  }

  private signature(): string {
    return `${this.name ?? ""}\u0001${this.checkable.isChecked ? 1 : 0}\u0001${
      this.value ?? ""
    }\u0001${this.form.isRequired ? 1 : 0}\u0001${this.form.isInvalid ? 1 : 0}`;
  }

  render(): VNode {
    const {
      state,
      isChecked: checked,
      isIndeterminate: indeterminate,
      hasFocus,
      hasFocusVisible,
    } = this.checkable;
    const stateAttrs = {
      "data-state": state,
      "data-disabled": dataAttr(this.form.isDisabled),
      "data-readonly": dataAttr(this.form.isReadOnly),
      "data-invalid": dataAttr(this.form.isInvalid),
      "data-required": dataAttr(this.form.isRequired),
      "data-focus": dataAttr(hasFocus),
      "data-focus-visible": dataAttr(hasFocusVisible),
    };

    return (
      <Host class={styles.host}>
        <label
          data-scope="checkbox"
          data-part="root"
          {...stateAttrs}
          id={this.rootId}
          htmlFor={this.inputId}
          class={styles.root}
          part="root"
        >
          <span
            data-scope="checkbox"
            data-part="control"
            {...stateAttrs}
            id={this.controlId}
            aria-hidden="true"
            class={styles.control}
            part="control"
          >
            <span
              data-scope="checkbox"
              data-part="indicator"
              {...stateAttrs}
              hidden={!checked && !indeterminate}
              class={styles.indicator}
              part="indicator"
            >
              {indeterminate ? <RemoveIcon /> : <CheckIcon />}
            </span>
          </span>
          <span
            ref={(el) => {
              this.labelEl = el;
            }}
            data-scope="checkbox"
            data-part="label"
            {...stateAttrs}
            id={this.labelId}
            class={styles.label}
            part="label"
          >
            <slot>{this.label}</slot>
            <span
              data-scope="checkbox"
              data-part="required-indicator"
              aria-hidden="true"
              data-required={dataAttr(this.form.isRequired)}
              class={requiredIndicatorStyle}
              part="required-indicator"
            >
              {this.defaultMarker}
            </span>
          </span>
          <input
            {...this.inputProps}
            ref={(el) => {
              this.inputEl = el;
              this.checkable.setInput(el);
            }}
            type="checkbox"
            value={this.value ?? "on"}
            aria-labelledby={this.labelId}
            class={styles.input}
            part="input"
          />
        </label>
      </Host>
    );
  }
}

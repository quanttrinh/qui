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
import { CheckIcon } from "../qui-icon/icons";
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
import { focusRing } from "../shared/styles";

const styles = {
  host: css({ display: "inline-flex" }),
  root: css({
    display: "inline-flex",
    alignItems: "center",
    gap: "2",
    cursor: "pointer",
    userSelect: "none",
    "&[data-disabled]": { cursor: "not-allowed", opacity: 0.38 },
  }),
  control: css({
    position: "relative",
    display: "inline-flex",
    flexShrink: 0,
    width: "12",
    height: "8",
    rounded: "full",
    borderWidth: "2px",
    borderStyle: "solid",
    borderColor: "outline",
    backgroundColor: "surfaceContainerHighest",
    transition: "background-color 150ms ease, border-color 150ms ease",
    "&[data-state=checked]": {
      backgroundColor: "primary",
      borderColor: "primary",
    },
    "&[data-invalid]": { borderColor: "error" },
    "&[data-focus-visible]": focusRing,
  }),
  thumb: css({
    position: "absolute",
    top: "50%",
    insetInlineStart: "1.5",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "4",
    height: "4",
    rounded: "full",
    overflow: "hidden",
    color: "primary",
    backgroundColor: "outline",
    transform: "translateY(-50%)",
    transition:
      "inset-inline-start 150ms ease, width 150ms ease, height 150ms ease, background-color 150ms ease",
    "& svg": {
      opacity: 0,
      transition: "opacity 150ms ease",
    },
    "&[data-state=checked]": {
      insetInlineStart: "calc(100% - 1.65rem)",
      width: "6",
      height: "6",
      backgroundColor: "onPrimary",
      "& svg": { opacity: 1 },
    },
  }),
  label: css({
    cursor: "pointer",
    fontSize: "sm",
    fontWeight: "medium",
    color: "onSurface",
  }),
  input: css({
    position: "absolute",
    width: "1px",
    height: "1px",
    padding: "0",
    margin: "-1px",
    overflow: "hidden",
    clip: "rect(0, 0, 0, 0)",
    whiteSpace: "nowrap",
    borderWidth: "0",
  }),
};

/**
 * MD3 switch.
 *
 * @slot - Label content. Falls back to the `label` prop.
 */
@Component({
  tag: "qui-switch",
  styleUrl: resolveVar(styleUrls.quiSwitch),
  shadow: true,
  formAssociated: true,
})
export class QuiSwitch extends Mixin(ControllerHostMixin, FormControlMixin) {
  @Element() host!: HTMLQuiSwitchElement;
  @AttachInternals() internals!: ElementInternals;

  /** The controlled checked state. Leave unset for an uncontrolled switch. */
  @Prop({ mutable: true }) checked?: boolean;
  /** The initial checked state for an uncontrolled switch. */
  @Prop() defaultChecked?: boolean;
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
  checkedChange!: EventEmitter<{ checked: boolean }>;

  private inputEl?: HTMLInputElement;
  private labelEl?: HTMLElement;
  private readonly generatedId = nextId("qui-switch");
  private readonly fieldControl = createFieldControl(() => this.inputEl, {
    activateOnLabel: true,
  });
  private readonly checkable = new CheckableController(this, {
    getChecked: (): boolean | undefined => this.checked,
    getDefaultChecked: (): boolean | undefined => this.defaultChecked,
    supportsIndeterminate: false,
    isDisabled: (): boolean => this.form.isDisabled,
    isReadOnly: (): boolean => this.form.isReadOnly,
    onChange: (checked: CheckedState): void => {
      this.checkedChange.emit({ checked: checked === true });
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
      this.checked = this.checkable.initialChecked === true;
      this.checkable.reset();
    },
    onRestore: (values: string[]): void => {
      const checked = this.checkable.normalize(values.at(0)) === true;
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
    return `switch:${this.host.id || this.generatedId}`;
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

  private get thumbId(): string {
    return `${this.rootId}:thumb`;
  }

  private get inputProps(): Record<string, string | number | boolean | undefined> {
    const field = this.form.fieldApi;
    const props: Record<string, string | number | boolean | undefined> =
      field === undefined
        ? {
            id: this.inputId,
            disabled: this.form.isDisabled,
            "aria-invalid": this.form.isInvalid ? "true" : "false",
            "data-scope": "switch",
            "data-part": "input",
            "data-invalid": dataAttr(this.form.isInvalid),
            "data-required": dataAttr(this.form.isRequired),
            "data-readonly": dataAttr(this.form.isReadOnly),
          }
        : { ...field.getInputProps() };
    delete props.required;
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
    const { state, hasFocus, hasFocusVisible } = this.checkable;
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
          data-scope="switch"
          data-part="root"
          {...stateAttrs}
          id={this.rootId}
          htmlFor={this.inputId}
          class={styles.root}
          part="root"
        >
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
          <span
            data-scope="switch"
            data-part="control"
            {...stateAttrs}
            id={this.controlId}
            aria-hidden="true"
            class={styles.control}
            part="control"
          >
            <span
              data-scope="switch"
              data-part="thumb"
              {...stateAttrs}
              id={this.thumbId}
              aria-hidden="true"
              class={styles.thumb}
              part="thumb"
            >
              <CheckIcon />
            </span>
          </span>
          <span
            ref={(el) => {
              this.labelEl = el;
            }}
            data-scope="switch"
            data-part="label"
            {...stateAttrs}
            id={this.labelId}
            class={styles.label}
            part="label"
          >
            <slot>{this.label}</slot>
          </span>
        </label>
      </Host>
    );
  }
}

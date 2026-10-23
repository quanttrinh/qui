import {
  resolveVar,
  AttachInternals,
  Component,
  Element,
  Event,
  forceUpdate,
  h,
  Host,
  Prop,
  Watch,
  type EventEmitter,
  type VNode,
} from "@stencil/core";
import {
  connect as checkboxConnect,
  machine as checkboxMachine,
  type Api as CheckboxApi,
  type CheckedState,
  type Props as CheckboxProps,
} from "@zag-js/checkbox";
import { normalizeProps, spreadProps, VanillaMachine } from "@zag-js/vanilla";

import { styleUrls } from "#qui-style-url";
import { css, cx } from "#styled-system/css";

import { getRootNode } from "../../utilities/dom";
import { nextId } from "../../utilities/id";
import { type MachineSchemaOf } from "../../utilities/zag";
import { consumeField, type FieldApi } from "../qui-field/field-context";
import { CheckIcon, RemoveIcon } from "../qui-icon/icons";

type CheckboxSchema = MachineSchemaOf<typeof checkboxMachine>;

const styles = {
  host: css({ display: "inline-flex" }),
  root: css({
    display: "inline-flex",
    alignItems: "center",
    gap: "2",
    minHeight: "11",
    cursor: "pointer",
    userSelect: "none",
    "&[data-disabled]": { cursor: "not-allowed", opacity: 0.38 },
  }),
  control: css({
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    width: "5",
    height: "5",
    rounded: "sm",
    borderWidth: "2px",
    borderStyle: "solid",
    borderColor: "outline",
    color: "transparent",
    backgroundColor: "transparent",
    transition: "background-color 150ms, border-color 150ms, color 150ms",
    "&:hover": { borderColor: "onSurface" },
    "&[data-state=checked], &[data-state=indeterminate]": {
      borderColor: "primary",
      backgroundColor: "primary",
      color: "onPrimary",
    },
    "&[data-invalid]": { borderColor: "error" },
    "&[data-focus-visible]": {
      outlineWidth: "2px",
      outlineStyle: "solid",
      outlineColor: "primary",
      outlineOffset: "2px",
    },
  }),
  indicator: css({
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "sm",
    lineHeight: 1,
    "& svg": { width: "1em", height: "1em" },
  }),
  label: css({
    cursor: "pointer",
    fontSize: "sm",
    fontWeight: "medium",
    color: "onSurface",
  }),
};

/** Normalize a Stencil attribute/property value into a Zag checked state. */
function normalizeChecked(value: unknown): CheckedState | undefined {
  if (value === "indeterminate") {
    return "indeterminate";
  }
  if (value === "" || value === "true" || value === true) {
    return true;
  }
  if (value === "false" || value === false) {
    return false;
  }
  return undefined;
}

/**
 * MD3 checkbox with a Zag state machine.
 *
 * @slot - Label content. Falls back to the `label` prop.
 */
@Component({
  tag: "qui-checkbox",
  styleUrl: resolveVar(styleUrls.quiCheckbox),
  scoped: true,
  formAssociated: true,
})
export class QuiCheckbox {
  @Element() host!: HTMLQuiCheckboxElement;
  // oxlint-disable-next-line eslint/new-cap
  @AttachInternals() internals!: ElementInternals;

  /** The controlled checked state. Leave unset for an uncontrolled checkbox. */
  @Prop() checked?: CheckedState;
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
  /** Additional class applied to the root label. */
  @Prop() innerClass?: string;

  /** Emitted whenever the checked state changes. */
  @Event({ eventName: "checkedchange", bubbles: true, composed: true })
  checkedChange!: EventEmitter<{ checked: CheckedState }>;

  private formDisabled = false;

  private machine?: VanillaMachine<CheckboxSchema>;
  private unsubscribe?: () => void;
  private field?: FieldApi;
  private fieldUnsubscribe?: () => void;
  private spreads: (() => void)[] = [];
  private rootEl?: HTMLLabelElement;
  private controlEl?: HTMLSpanElement;
  private indicatorEl?: HTMLSpanElement;
  private labelEl?: HTMLSpanElement;
  private inputEl?: HTMLInputElement;
  private initialChecked!: CheckedState;
  private readonly generatedId = nextId("qui-checkbox");

  public componentWillLoad(): void {
    this.initialChecked = normalizeChecked(this.defaultChecked ?? this.checked) ?? false;
    this.attachField();
    this.machine = new VanillaMachine(checkboxMachine, () => this.machineProps());
    this.unsubscribe = this.machine.subscribe(() => {
      forceUpdate(this.host);
    });
    this.machine.start();
  }

  public componentDidLoad(): void {
    if (this.field === undefined) {
      this.attachField();
    }
  }

  public componentDidRender(): void {
    this.applySpreads();
  }

  public formResetCallback(): void {
    this.checked = this.initialChecked;
    this.syncMachineProps();
    this.syncFormState();
  }

  public formDisabledCallback(disabled: boolean): void {
    this.formDisabled = disabled;
    this.machine?.updateProps(this.machineProps());
  }

  public formStateRestoreCallback(state: string | File | FormData | null): void {
    if (typeof state === "string") {
      this.checked = normalizeChecked(state) ?? false;
      this.syncMachineProps();
      this.syncFormState();
    }
  }

  public disconnectedCallback(): void {
    for (const cleanup of this.spreads) {
      cleanup();
    }
    this.spreads = [];
    this.fieldUnsubscribe?.();
    this.unsubscribe?.();
    this.machine?.stop();
  }

  @Watch("checked")
  @Watch("indeterminate")
  @Watch("disabled")
  @Watch("invalid")
  @Watch("required")
  @Watch("readOnly")
  @Watch("name")
  @Watch("value")
  private syncMachineProps(): void {
    this.machine?.updateProps(this.machineProps());
  }

  private attachField(): void {
    const field = consumeField(this.host);
    if (field === undefined || field === this.field) {
      return;
    }
    this.fieldUnsubscribe?.();
    this.field = field;
    this.fieldUnsubscribe = field.subscribe(() => {
      this.machine?.updateProps(this.machineProps());
      forceUpdate(this.host);
    });
    this.machine?.updateProps(this.machineProps());
  }

  private machineProps(): CheckboxProps {
    const { field } = this;
    return {
      id: this.host.id || this.generatedId,
      getRootNode: () => getRootNode(this.host),
      checked: this.indeterminate ? "indeterminate" : normalizeChecked(this.checked),
      defaultChecked: normalizeChecked(this.defaultChecked),
      disabled: this.formDisabled || (field?.disabled() ?? this.disabled),
      invalid: field?.invalid() ?? this.invalid,
      readOnly: field?.readOnly() ?? this.readOnly,
      required: field?.required() ?? this.required,
      name: this.name,
      value: this.value,
      ids: field === undefined ? undefined : { hiddenInput: field.ids.control },
      onCheckedChange: (details) => {
        this.checkedChange.emit(details);
      },
    };
  }

  private get isRequired(): boolean {
    return this.field?.required() ?? this.required;
  }

  private get isInvalid(): boolean {
    return this.field?.invalid() ?? this.invalid;
  }

  private get api(): CheckboxApi | undefined {
    return this.machine === undefined
      ? undefined
      : checkboxConnect(this.machine.service, normalizeProps);
  }

  private applySpreads(): void {
    const { api } = this;
    if (api === undefined) {
      return;
    }

    this.spreads = [];
    if (this.rootEl !== undefined) {
      this.spreads.push(
        spreadProps(this.rootEl, {
          ...api.getRootProps(),
          class: cx(styles.root, this.innerClass),
        }),
      );
    }
    if (this.controlEl !== undefined) {
      this.spreads.push(
        spreadProps(this.controlEl, { ...api.getControlProps(), class: styles.control }),
      );
    }
    if (this.indicatorEl !== undefined) {
      this.spreads.push(
        spreadProps(this.indicatorEl, {
          ...api.getIndicatorProps(),
          class: styles.indicator,
        }),
      );
    }
    if (this.labelEl !== undefined) {
      this.spreads.push(spreadProps(this.labelEl, { ...api.getLabelProps(), class: styles.label }));
    }
    if (this.inputEl !== undefined) {
      const hiddenInputProps =
        this.field === undefined
          ? api.getHiddenInputProps()
          : { ...this.field.getInputProps(), ...api.getHiddenInputProps() };
      const { name: _name, required: _required, ...inputProps } = hiddenInputProps;
      this.spreads.push(spreadProps(this.inputEl, inputProps));
    }
    this.syncFormState(api);
  }

  private syncFormState(api: CheckboxApi | undefined = this.api): void {
    if (api === undefined) {
      return;
    }

    // oxlint-disable-next-line unicorn/no-null
    this.internals.setFormValue(api.checked ? (this.value ?? "on") : null, String(api.checked));

    if (this.isRequired && !api.checked) {
      this.internals.setValidity(
        { valueMissing: true },
        "Please check this box if you want to proceed.",
        this.inputEl,
      );
      return;
    }
    if (this.isInvalid) {
      this.internals.setValidity({ customError: true }, "Invalid value", this.inputEl);
      return;
    }
    this.internals.setValidity({});
  }

  public render(): VNode {
    const indeterminate = this.api?.indeterminate ?? false;

    return (
      <Host class={styles.host}>
        <label
          ref={(el) => {
            if (el instanceof HTMLLabelElement) {
              this.rootEl = el;
            }
          }}
          class={styles.root}
          part="root"
        >
          <span
            ref={(el) => {
              if (el instanceof HTMLSpanElement) {
                this.controlEl = el;
              }
            }}
            class={styles.control}
            part="control"
          >
            <span
              ref={(el) => {
                if (el instanceof HTMLSpanElement) {
                  this.indicatorEl = el;
                }
              }}
              class={styles.indicator}
              part="indicator"
            >
              {indeterminate ? <RemoveIcon /> : <CheckIcon />}
            </span>
          </span>
          <span
            ref={(el) => {
              if (el instanceof HTMLSpanElement) {
                this.labelEl = el;
              }
            }}
            class={styles.label}
            part="label"
          >
            <slot>{this.label}</slot>
          </span>
          <input
            ref={(el) => {
              if (el instanceof HTMLInputElement) {
                this.inputEl = el;
              }
            }}
          />
        </label>
      </Host>
    );
  }
}

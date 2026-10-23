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
  connect as switchConnect,
  machine as switchMachine,
  type Api as SwitchApi,
  type Props as SwitchProps,
} from "@zag-js/switch";
import { normalizeProps, spreadProps, VanillaMachine } from "@zag-js/vanilla";

import { styleUrls } from "#qui-style-url";
import { css, cx } from "#styled-system/css";

import { getRootNode } from "../../utilities/dom";
import { nextId } from "../../utilities/id";
import { type MachineSchemaOf } from "../../utilities/zag";
import { consumeField, type FieldApi } from "../qui-field/field-context";
import { CheckIcon } from "../qui-icon/icons";

type SwitchSchema = MachineSchemaOf<typeof switchMachine>;

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
    "&[data-focus-visible]": {
      outlineWidth: "2px",
      outlineStyle: "solid",
      outlineColor: "primary",
      outlineOffset: "2px",
    },
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
};

function normalizeBoolean(value: unknown): boolean | undefined {
  if (value === "" || value === "true" || value === true) {
    return true;
  }
  if (value === "false" || value === false) {
    return false;
  }
  return undefined;
}

/**
 * MD3 switch with a Zag state machine.
 *
 * @slot - Label content. Falls back to the `label` prop.
 */
@Component({
  tag: "qui-switch",
  styleUrl: resolveVar(styleUrls.quiSwitch),
  scoped: true,
  formAssociated: true,
})
export class QuiSwitch {
  @Element() host!: HTMLQuiSwitchElement;
  // oxlint-disable-next-line eslint/new-cap
  @AttachInternals() internals!: ElementInternals;

  /** The controlled checked state. Leave unset for an uncontrolled switch. */
  @Prop() checked?: boolean;
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
  /** Additional class applied to the root label. */
  @Prop() innerClass?: string;

  /** Emitted whenever the checked state changes. */
  @Event({ eventName: "checkedchange", bubbles: true, composed: true })
  checkedChange!: EventEmitter<{ checked: boolean }>;

  private formDisabled = false;

  private machine?: VanillaMachine<SwitchSchema>;
  private unsubscribe?: () => void;
  private field?: FieldApi;
  private fieldUnsubscribe?: () => void;
  private spreads: (() => void)[] = [];
  private rootEl?: HTMLLabelElement;
  private controlEl?: HTMLSpanElement;
  private thumbEl?: HTMLSpanElement;
  private labelEl?: HTMLSpanElement;
  private inputEl?: HTMLInputElement;
  private initialChecked = false;
  private readonly generatedId = nextId("qui-switch");

  public componentWillLoad(): void {
    this.initialChecked = normalizeBoolean(this.defaultChecked ?? this.checked) ?? false;
    this.attachField();
    this.machine = new VanillaMachine(switchMachine, () => this.machineProps());
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
      this.checked = normalizeBoolean(state) ?? false;
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

  private machineProps(): SwitchProps {
    const { field } = this;
    return {
      id: this.host.id || this.generatedId,
      getRootNode: () => getRootNode(this.host),
      checked: normalizeBoolean(this.checked),
      defaultChecked: normalizeBoolean(this.defaultChecked),
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

  private get api(): SwitchApi | undefined {
    return this.machine === undefined
      ? undefined
      : switchConnect(this.machine.service, normalizeProps);
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
    if (this.inputEl !== undefined) {
      const hiddenInputProps =
        this.field === undefined
          ? api.getHiddenInputProps()
          : { ...this.field.getInputProps(), ...api.getHiddenInputProps() };
      const { name: _name, required: _required, ...inputProps } = hiddenInputProps;
      this.spreads.push(spreadProps(this.inputEl, inputProps));
    }
    if (this.controlEl !== undefined) {
      this.spreads.push(
        spreadProps(this.controlEl, { ...api.getControlProps(), class: styles.control }),
      );
    }
    if (this.thumbEl !== undefined) {
      this.spreads.push(spreadProps(this.thumbEl, { ...api.getThumbProps(), class: styles.thumb }));
    }
    if (this.labelEl !== undefined) {
      this.spreads.push(spreadProps(this.labelEl, { ...api.getLabelProps(), class: styles.label }));
    }
    this.syncFormState(api);
  }

  private syncFormState(api: SwitchApi | undefined = this.api): void {
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
          <input
            ref={(el) => {
              if (el instanceof HTMLInputElement) {
                this.inputEl = el;
              }
            }}
          />
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
                  this.thumbEl = el;
                }
              }}
              class={styles.thumb}
              part="thumb"
            >
              <CheckIcon />
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
        </label>
      </Host>
    );
  }
}

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
  connect as radioGroupConnect,
  machine as radioGroupMachine,
  type Api as ZagRadioGroupApi,
  type Props as RadioGroupProps,
} from "@zag-js/radio-group";
import { normalizeProps, spreadProps, VanillaMachine } from "@zag-js/vanilla";

import { styleUrls } from "#qui-style-url";
import { css, cx } from "#styled-system/css";

import { getRootNode } from "../../utilities/dom";
import { nextId } from "../../utilities/id";
import { type MachineSchemaOf } from "../../utilities/zag";
import { consumeField, type FieldApi } from "../qui-field/field-context";
import { provideRadioGroup, clearRadioGroup, type RadioGroupApi } from "./radio-group-context";

type RadioGroupSchema = MachineSchemaOf<typeof radioGroupMachine>;

const styles = {
  host: css({ display: "block" }),
  root: css({
    display: "flex",
    flexDirection: "column",
    gap: "2",
  }),
  horizontal: css({ flexDirection: "row" }),
};

/**
 * MD3 radio group. Compose with `qui-radio` children.
 *
 * @slot - `qui-radio` items.
 */
@Component({
  tag: "qui-radio-group",
  styleUrl: resolveVar(styleUrls.quiRadioGroup),
  scoped: true,
  formAssociated: true,
})
export class QuiRadioGroup {
  @Element() host!: HTMLQuiRadioGroupElement;
  // oxlint-disable-next-line eslint/new-cap
  @AttachInternals() internals!: ElementInternals;

  /** The controlled selected value. */
  @Prop() value?: string;
  /** The initial selected value for an uncontrolled group. */
  @Prop() defaultValue?: string;
  /** The form field name shared by the radio inputs. */
  @Prop() name?: string;
  /** Disables the whole group. */
  @Prop() disabled = false;
  /** Marks the whole group invalid. */
  @Prop() invalid = false;
  /** Marks the whole group required. */
  @Prop() required = false;
  /** Makes the whole group read-only. */
  @Prop() readOnly = false;
  /** Layout orientation. */
  @Prop() orientation: "horizontal" | "vertical" = "vertical";
  /** Text direction. */
  @Prop() textDirection?: "ltr" | "rtl";
  /** Additional class applied to the root element. */
  @Prop() innerClass?: string;

  /** Emitted whenever the selected value changes. */
  @Event({ eventName: "valuechange", bubbles: true, composed: true })
  valueChange!: EventEmitter<{ value: string | undefined }>;

  private formDisabled = false;

  private machine?: VanillaMachine<RadioGroupSchema>;
  private unsubscribe?: () => void;
  private field?: FieldApi;
  private fieldUnsubscribe?: () => void;
  private readonly listeners = new Set<() => void>();
  private spreads: (() => void)[] = [];
  private rootEl?: HTMLDivElement;
  private initialValue = "";
  private readonly generatedId = nextId("qui-radio-group");

  public componentWillLoad(): void {
    this.initialValue = this.defaultValue ?? this.value ?? "";
    this.attachField();
    this.machine = new VanillaMachine(radioGroupMachine, () => this.machineProps());
    this.unsubscribe = this.machine.subscribe(() => {
      forceUpdate(this.host);
      this.notifyListeners();
    });
    this.machine.start();
    provideRadioGroup(this.host, this.groupApi());
  }

  public connectedCallback(): void {
    if (this.machine !== undefined) {
      provideRadioGroup(this.host, this.groupApi());
    }
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
    this.value = this.initialValue || undefined;
    this.syncMachineProps();
    this.syncFormState();
  }

  public formDisabledCallback(disabled: boolean): void {
    this.formDisabled = disabled;
    this.machine?.updateProps(this.machineProps());
  }

  public formStateRestoreCallback(state: string | File | FormData | null): void {
    if (typeof state === "string") {
      this.value = state || undefined;
      this.syncMachineProps();
      this.syncFormState();
    }
  }

  public disconnectedCallback(): void {
    clearRadioGroup(this.host);
    for (const cleanup of this.spreads) {
      cleanup();
    }
    this.spreads = [];
    this.fieldUnsubscribe?.();
    this.unsubscribe?.();
    this.machine?.stop();
    this.listeners.clear();
  }

  @Watch("value")
  @Watch("name")
  @Watch("disabled")
  @Watch("invalid")
  @Watch("required")
  @Watch("readOnly")
  @Watch("orientation")
  @Watch("textDirection")
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
    });
    this.machine?.updateProps(this.machineProps());
  }

  private machineProps(): RadioGroupProps {
    const { field } = this;
    return {
      id: this.host.id || this.generatedId,
      getRootNode: () => getRootNode(this.host),
      value: this.value,
      defaultValue: this.defaultValue,
      name: this.name,
      disabled: this.formDisabled || (field?.disabled() ?? this.disabled),
      invalid: field?.invalid() ?? this.invalid,
      required: field?.required() ?? this.required,
      readOnly: field?.readOnly() ?? this.readOnly,
      orientation: this.orientation,
      dir: this.textDirection,
      onValueChange: (details) => {
        this.valueChange.emit({ value: details.value ?? undefined });
      },
    };
  }

  private notifyListeners(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }

  private groupApi(): RadioGroupApi {
    return {
      itemProps: (item) => {
        const { api } = this;
        return {
          root: { ...api.getItemProps(item) },
          control: { ...api.getItemControlProps(item) },
          text: { ...api.getItemTextProps(item) },
          hiddenInput: { ...api.getItemHiddenInputProps(item) },
        };
      },
      subscribe: (listener) => {
        this.listeners.add(listener);
        return () => {
          this.listeners.delete(listener);
        };
      },
    };
  }

  private rootProps(api: ZagRadioGroupApi): Record<string, unknown> {
    const root = { ...api.getRootProps() };
    if (this.field === undefined) {
      return root;
    }
    const control = this.field.getInputProps();
    return {
      ...root,
      "aria-labelledby": this.field.ids.label,
      "aria-describedby": control["aria-describedby"],
      "aria-errormessage": control["aria-errormessage"],
    };
  }

  private get api(): ZagRadioGroupApi {
    if (this.machine === undefined) {
      throw new Error("qui-radio-group has not been initialized");
    }
    return radioGroupConnect(this.machine.service, normalizeProps);
  }

  private applySpreads(): void {
    if (this.rootEl === undefined) {
      return;
    }
    const { api } = this;
    this.spreads = [];
    this.spreads.push(
      spreadProps(this.rootEl, {
        ...this.rootProps(api),
        class: cx(
          styles.root,
          this.orientation === "horizontal" ? styles.horizontal : "",
          this.innerClass,
        ),
      }),
    );
    this.syncFormState(api);
  }

  private syncFormState(api: ZagRadioGroupApi = this.api): void {
    // oxlint-disable-next-line unicorn/no-null
    const value = api.value ?? null;
    this.internals.setFormValue(value);

    if (this.isRequired && value === null) {
      this.internals.setValidity(
        { valueMissing: true },
        "Please select one of these options.",
        this.rootEl,
      );
      return;
    }
    if (this.isInvalid) {
      this.internals.setValidity({ customError: true }, "Invalid value", this.rootEl);
      return;
    }
    this.internals.setValidity({});
  }

  private get isRequired(): boolean {
    return this.field?.required() ?? this.required;
  }

  private get isInvalid(): boolean {
    return this.field?.invalid() ?? this.invalid;
  }

  public render(): VNode {
    return (
      <Host class={styles.host}>
        <div
          ref={(el) => {
            if (el instanceof HTMLDivElement) {
              this.rootEl = el;
            }
          }}
          class={styles.root}
          part="root"
          role="radiogroup"
          aria-orientation={this.orientation}
        >
          <slot />
        </div>
      </Host>
    );
  }
}

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
import { type ListCollection } from "@zag-js/collection";
import {
  collection,
  connect as selectConnect,
  type Api as SelectApi,
  machine as selectMachine,
  type OpenChangeDetails,
  type PositioningOptions,
  type Props as SelectProps,
  type ScrollToIndexDetails,
  type ValueChangeDetails,
} from "@zag-js/select";
import { type PropTypes } from "@zag-js/types";
import { normalizeProps, spreadProps, VanillaMachine } from "@zag-js/vanilla";

import { styleUrls } from "#qui-style-url";
import { css, cx } from "#styled-system/css";

import { getRootNode } from "../../utilities/dom";
import { nextId } from "../../utilities/id";
import { optionLabel, type OptionElement } from "../../utilities/options";
import { type MachineSchemaOf } from "../../utilities/zag";
import { consumeField, type FieldApi } from "../qui-field/field-context";
import { CheckIcon, UnfoldMoreIcon } from "../qui-icon/icons";
import { listStyles } from "./list-styles";

type SelectSchema = MachineSchemaOf<typeof selectMachine>;

interface OptionData {
  value: string;
  label: string;
  disabled: boolean;
}

const defaultPositioning: PositioningOptions = {
  sameWidth: true,
  flip: true,
  placement: "bottom-start",
};

const styles = {
  host: css({ display: "block", position: "relative", width: "full" }),
  root: css({ position: "relative", width: "full" }),
  control: css({ width: "full" }),
  trigger: css({
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "2",
    width: "full",
    height: "10",
    paddingInlineStart: "3",
    paddingInlineEnd: "1.5",
    fontSize: "sm",
    color: "onSurface",
    backgroundColor: "surface",
    borderWidth: "1px",
    borderColor: "outlineVariant",
    rounded: "lg",
    cursor: "pointer",
    textAlign: "start",
    transition: "border-color 150ms, outline-color 150ms",
    "&:hover": { borderColor: "outline" },
    "&:focus-visible": {
      outlineWidth: "2px",
      outlineStyle: "solid",
      outlineColor: "primary",
      outlineOffset: "0",
      borderColor: "primary",
    },
    "&[data-placeholder-shown]": { color: "onSurfaceVariant" },
    "&[data-invalid]": { borderColor: "error" },
    "&:disabled": { opacity: 0.38, cursor: "not-allowed" },
  }),
  valueText: css({
    flex: "1",
    overflow: "hidden",
    textAlign: "start",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  }),
  indicator: css({
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    width: "6",
    height: "6",
    color: "onSurfaceVariant",
    fontSize: "md",
    "& svg": { width: "1em", height: "1em" },
    "&[data-state=open]": { transform: "rotate(180deg)" },
  }),
  listContent: css({
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    paddingBlock: "2",
  }),
  listViewport: css({
    flex: "1 1 auto",
    minHeight: "0",
    overflowY: "auto",
    maxHeight: "min(320px, var(--available-height))",
  }),
};

/**
 * MD3 select. Provide options with `qui-option` children or a `collection`
 * property.
 */
@Component({
  tag: "qui-select",
  styleUrl: resolveVar(styleUrls.quiSelect),
  scoped: true,
  formAssociated: true,
})
export class QuiSelect {
  @Element() host!: HTMLQuiSelectElement;
  // oxlint-disable-next-line eslint/new-cap
  @AttachInternals() internals!: ElementInternals;

  /** A prepared Zag collection. Property-only. */
  @Prop() collection?: ListCollection<OptionData>;
  /** The controlled selected values. Property-only. */
  @Prop() value?: string[];
  /** The initial selected values. Property-only. */
  @Prop() defaultValue?: string[];
  /** The form field name. */
  @Prop() name?: string;
  /** Trigger text when no value is selected. */
  @Prop() placeholder = "Select an option";
  /** Disables the select. */
  @Prop() disabled = false;
  /** Marks the select invalid. */
  @Prop() invalid = false;
  /** Makes the select read-only. */
  @Prop() readOnly = false;
  /** Marks the select required. */
  @Prop() required = false;
  /** Allows multiple selected values. */
  @Prop() multiple = false;
  /** Whether selecting an item closes the menu. */
  @Prop() closeOnSelect?: boolean;
  /** Whether keyboard navigation wraps. */
  @Prop() loopFocus = false;
  /** Whether clicking the selected item clears it. */
  @Prop() deselectable = false;
  /** The controlled open state. */
  @Prop() open?: boolean;
  /** The initial open state. */
  @Prop() defaultOpen = false;
  /** Popper positioning options. Property-only. */
  @Prop() positioning?: PositioningOptions;
  /** Text direction. */
  @Prop() textDirection?: "ltr" | "rtl";
  /** Additional class applied to the root element. */
  @Prop() innerClass?: string;

  /** Emitted whenever the selected values change. */
  @Event({ eventName: "valuechange", bubbles: true, composed: true })
  valueChange!: EventEmitter<ValueChangeDetails<OptionData>>;

  /** Emitted whenever the menu opens or closes. */
  @Event({ eventName: "openchange", bubbles: true, composed: true })
  openChange!: EventEmitter<OpenChangeDetails>;

  private formDisabled = false;

  private machine?: VanillaMachine<SelectSchema>;
  private unsubscribe?: () => void;
  private field?: FieldApi;
  private fieldUnsubscribe?: () => void;
  private observer?: MutationObserver;
  private spreads: (() => void)[] = [];
  private rootEl?: HTMLDivElement;
  private hiddenSelectEl?: HTMLSelectElement;
  private controlEl?: HTMLDivElement;
  private triggerEl?: HTMLButtonElement;
  private valueTextEl?: HTMLSpanElement;
  private indicatorEl?: HTMLSpanElement;
  private positionerEl?: HTMLDivElement;
  private contentEl?: HTMLDivElement;
  private wasOpen = false;
  private initialValue: string[] = [];
  private lastFormSignature = "";
  private readonly generatedId = nextId("qui-select");

  public componentWillLoad(): void {
    this.initialValue = [...(this.defaultValue ?? this.value ?? [])];
    this.attachField();
    this.machine = new VanillaMachine(selectMachine, () => this.machineProps());
    this.unsubscribe = this.machine.subscribe(() => {
      forceUpdate(this.host);
    });
    this.machine.start();
  }

  public componentDidLoad(): void {
    if (this.field === undefined) {
      this.attachField();
    }
    this.observer = new MutationObserver((records) => {
      const optionsChanged = records.some((record) => {
        const nodes = [...record.addedNodes, ...record.removedNodes];
        return nodes.some((node) => node instanceof HTMLElement && node.tagName === "QUI-OPTION");
      });
      if (optionsChanged) {
        this.machine?.updateProps(this.machineProps());
      }
    });
    this.observer.observe(this.host, { childList: true });
  }

  public componentDidRender(): void {
    const { api } = this;
    this.applySpreads(api);
    const { open } = api;
    // Zag's focus can run before props apply; focus after the DOM patch instead.
    if (open && !this.wasOpen) {
      this.contentEl?.focus({ preventScroll: true });
    }
    this.wasOpen = open;
  }

  public formResetCallback(): void {
    this.value = [...this.initialValue];
    this.syncMachineProps();
    this.syncFormState();
  }

  public formDisabledCallback(disabled: boolean): void {
    this.formDisabled = disabled;
    this.machine?.updateProps(this.machineProps());
  }

  public formStateRestoreCallback(state: string | File | FormData | null): void {
    if (typeof state !== "string") {
      return;
    }
    try {
      const value: unknown = JSON.parse(state);
      if (Array.isArray(value)) {
        this.value = value.map(String);
        this.syncMachineProps();
        this.syncFormState();
      }
    } catch {
      // Ignore malformed restoration state.
    }
  }

  public disconnectedCallback(): void {
    this.observer?.disconnect();
    for (const cleanup of this.spreads) {
      cleanup();
    }
    this.spreads = [];
    this.fieldUnsubscribe?.();
    this.unsubscribe?.();
    this.machine?.stop();
  }

  @Watch("value")
  @Watch("name")
  @Watch("disabled")
  @Watch("invalid")
  @Watch("readOnly")
  @Watch("required")
  @Watch("multiple")
  @Watch("closeOnSelect")
  @Watch("loopFocus")
  @Watch("deselectable")
  @Watch("open")
  @Watch("positioning")
  @Watch("textDirection")
  @Watch("collection")
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

  private optionItems(): OptionData[] {
    return [...this.host.querySelectorAll<OptionElement>("qui-option")].map((option) => ({
      value: option.getAttribute("value") ?? "",
      label: optionLabel(option),
      disabled: option.hasAttribute("disabled"),
    }));
  }

  private buildCollection(): ListCollection<OptionData> {
    if (this.collection !== undefined) {
      return this.collection;
    }
    return collection({
      items: this.optionItems(),
      itemToValue: (item) => item.value,
      itemToString: (item) => item.label,
      isItemDisabled: (item) => item.disabled,
    });
  }

  private machineProps(): SelectProps<OptionData> {
    const { field } = this;
    return {
      id: this.host.id || this.generatedId,
      getRootNode: () => getRootNode(this.host),
      collection: this.buildCollection(),
      value: this.value,
      defaultValue: this.defaultValue,
      name: this.name,
      disabled: this.formDisabled || (field?.disabled() ?? this.disabled),
      invalid: field?.invalid() ?? this.invalid,
      readOnly: field?.readOnly() ?? this.readOnly,
      required: field?.required() ?? this.required,
      multiple: this.multiple,
      closeOnSelect: this.closeOnSelect,
      loopFocus: this.loopFocus,
      deselectable: this.deselectable,
      open: this.open,
      defaultOpen: this.defaultOpen,
      positioning: this.positioning ?? defaultPositioning,
      dir: this.textDirection,
      ids:
        field === undefined
          ? undefined
          : { hiddenSelect: field.ids.control, label: field.ids.label },
      scrollToIndexFn: (details: ScrollToIndexDetails) => {
        details.getElement()?.scrollIntoView({ block: "nearest" });
      },
      onValueChange: (details) => {
        this.valueChange.emit(details);
      },
      onOpenChange: (details) => {
        this.openChange.emit(details);
      },
    };
  }

  private triggerProps(api: SelectApi<PropTypes, OptionData>): Record<string, unknown> {
    const trigger = api.getTriggerProps();
    if (this.field === undefined) {
      return trigger;
    }
    const control = this.field.getInputProps();
    return {
      ...trigger,
      "aria-describedby": control["aria-describedby"],
      "aria-errormessage": control["aria-errormessage"],
    };
  }

  private get api(): SelectApi<PropTypes, OptionData> {
    if (this.machine === undefined) {
      throw new Error("qui-select has not been initialized");
    }
    return selectConnect<PropTypes, OptionData>(this.machine.service, normalizeProps);
  }

  private applySpreads(api: SelectApi<PropTypes, OptionData>): void {
    this.spreads = [];
    if (this.rootEl !== undefined) {
      this.spreads.push(
        spreadProps(this.rootEl, {
          ...api.getRootProps(),
          class: cx(styles.root, this.innerClass),
        }),
      );
    }
    this.applyHiddenSelect(api);
    if (this.controlEl !== undefined) {
      this.spreads.push(
        spreadProps(this.controlEl, { ...api.getControlProps(), class: styles.control }),
      );
    }
    if (this.triggerEl !== undefined) {
      this.spreads.push(
        spreadProps(this.triggerEl, { ...this.triggerProps(api), class: styles.trigger }),
      );
    }
    if (this.valueTextEl !== undefined) {
      this.spreads.push(
        spreadProps(this.valueTextEl, { ...api.getValueTextProps(), class: styles.valueText }),
      );
    }
    if (this.indicatorEl !== undefined) {
      this.spreads.push(
        spreadProps(this.indicatorEl, { ...api.getIndicatorProps(), class: styles.indicator }),
      );
    }
    if (this.positionerEl !== undefined) {
      this.spreads.push(
        spreadProps(this.positionerEl, {
          ...api.getPositionerProps(),
          class: listStyles.positioner,
        }),
      );
    }
    if (this.contentEl !== undefined) {
      this.spreads.push(
        spreadProps(this.contentEl, {
          ...api.getContentProps(),
          class: cx(listStyles.content, styles.listContent),
        }),
      );
    }
    this.applyItemSpreads(api);
    this.syncFormState(api);
  }

  private applyHiddenSelect(api: SelectApi<PropTypes, OptionData>): void {
    if (this.hiddenSelectEl === undefined) {
      return;
    }
    const { name: _name, required: _required, ...hiddenSelectProps } = api.getHiddenSelectProps();
    this.spreads.push(spreadProps(this.hiddenSelectEl, hiddenSelectProps));
  }

  private formKey(values: readonly string[]): string {
    return `${this.name ?? ""}\u0001${this.multiple}\u0001${this.isRequired}\u0001${this.isInvalid}\u0001${values.join("\u0000")}`;
  }

  private syncFormState(api: SelectApi<PropTypes, OptionData> = this.api): void {
    const values = api.value;
    const signature = this.formKey(values);
    if (signature === this.lastFormSignature) {
      return;
    }
    this.lastFormSignature = signature;
    let formValue: string | FormData = values[0] ?? "";
    if (this.multiple) {
      formValue = new FormData();
      for (const value of values) {
        if (this.name !== undefined) {
          formValue.append(this.name, value);
        }
      }
    }

    this.internals.setFormValue(formValue, JSON.stringify(values));
    this.applyFormValidity(values.length);
  }

  private applyFormValidity(valueCount: number): void {
    if (this.isRequired && valueCount === 0) {
      this.internals.setValidity(
        { valueMissing: true },
        "Please select an option.",
        this.triggerEl,
      );
      return;
    }
    if (this.isInvalid) {
      this.internals.setValidity({ customError: true }, "Invalid value", this.triggerEl);
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

  private applyItemSpreads(api: SelectApi<PropTypes, OptionData>): void {
    if (this.contentEl === undefined || this.contentEl.hidden === true) {
      return;
    }
    const { items } = api.collection;
    for (const element of this.contentEl.querySelectorAll<HTMLElement>("[data-qui-select-item]")) {
      const index = Number(element.dataset.index);
      const item = items.at(index);
      if (item !== undefined) {
        this.spreadItem(api, element, item);
      }
    }
  }

  private spreadItem(
    api: SelectApi<PropTypes, OptionData>,
    element: HTMLElement,
    item: OptionData,
  ): void {
    this.spreads.push(
      spreadProps(element, {
        ...api.getItemProps({ item }),
        class: listStyles.item,
      }),
    );
    const textEl = element.querySelector<HTMLElement>("[data-qui-select-item-text]");
    if (textEl !== null) {
      this.spreads.push(
        spreadProps(textEl, {
          ...api.getItemTextProps({ item }),
          class: listStyles.itemText,
        }),
      );
    }
    const indicatorEl = element.querySelector<HTMLElement>("[data-qui-select-item-indicator]");
    if (indicatorEl !== null) {
      this.spreads.push(
        spreadProps(indicatorEl, {
          ...api.getItemIndicatorProps({ item }),
          class: listStyles.itemIndicator,
        }),
      );
    }
  }

  public render(): VNode {
    const { api } = this;
    const { open, collection: fullCollection } = api;
    const collectionItems = fullCollection.items;
    const valueText = api.valueAsString || this.placeholder;

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
        >
          <select
            ref={(el) => {
              if (el instanceof HTMLSelectElement) {
                this.hiddenSelectEl = el;
              }
            }}
            hidden
          >
            {fullCollection.items.map((item: OptionData) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>

          <div
            ref={(el) => {
              if (el instanceof HTMLDivElement) {
                this.controlEl = el;
              }
            }}
            class={styles.control}
            part="control"
          >
            <button
              ref={(el) => {
                if (el instanceof HTMLButtonElement) {
                  this.triggerEl = el;
                }
              }}
              class={styles.trigger}
              part="trigger"
              type="button"
            >
              <span
                ref={(el) => {
                  if (el instanceof HTMLSpanElement) {
                    this.valueTextEl = el;
                  }
                }}
                class={styles.valueText}
                part="value-text"
              >
                {valueText}
              </span>
              <span
                ref={(el) => {
                  if (el instanceof HTMLSpanElement) {
                    this.indicatorEl = el;
                  }
                }}
                class={styles.indicator}
                part="indicator"
              >
                <UnfoldMoreIcon />
              </span>
            </button>
          </div>

          <div
            ref={(el) => {
              if (el instanceof HTMLDivElement) {
                this.positionerEl = el;
              }
            }}
            class={listStyles.positioner}
            part="positioner"
          >
            <div
              ref={(el) => {
                if (el instanceof HTMLDivElement) {
                  this.contentEl = el;
                }
              }}
              hidden={!open}
              class={cx(listStyles.content, styles.listContent)}
              part="content"
            >
              <div class={styles.listViewport} part="viewport">
                {collectionItems.map((item: OptionData, index: number) => (
                  <div
                    key={item.value}
                    data-qui-select-item=""
                    data-index={index}
                    class={listStyles.item}
                  >
                    <span data-qui-select-item-text="" class={listStyles.itemText}>
                      {item.label}
                    </span>
                    <span data-qui-select-item-indicator="" class={listStyles.itemIndicator}>
                      <CheckIcon />
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Host>
    );
  }
}

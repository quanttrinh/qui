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
  connect as comboboxConnect,
  type Api as ComboboxApi,
  machine as comboboxMachine,
  type InputValueChangeDetails,
  type OpenChangeDetails,
  type PositioningOptions,
  type Props as ComboboxProps,
  type ScrollToIndexDetails,
  type ValueChangeDetails,
} from "@zag-js/combobox";
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
import { listStyles } from "../qui-select/list-styles";

type ComboboxSchema = MachineSchemaOf<typeof comboboxMachine>;

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
  control: css({
    display: "flex",
    alignItems: "center",
    width: "full",
    height: "10",
    backgroundColor: "surface",
    borderWidth: "1px",
    borderColor: "outlineVariant",
    rounded: "lg",
    overflow: "hidden",
    transition: "border-color 150ms, outline-color 150ms",
    "&:hover": { borderColor: "outline" },
    "&:focus-within": {
      outlineWidth: "2px",
      outlineStyle: "solid",
      outlineColor: "primary",
      outlineOffset: "0",
      borderColor: "primary",
    },
    "&[data-invalid]": { borderColor: "error" },
    "&[data-disabled]": { opacity: 0.38, cursor: "not-allowed" },
  }),
  input: css({
    flex: "1",
    minWidth: "0",
    height: "full",
    paddingX: "3",
    fontSize: "sm",
    color: "onSurface",
    backgroundColor: "transparent",
    outlineStyle: "none",
    outlineWidth: "0",
    borderWidth: "0",
    "&::placeholder": { color: "onSurfaceVariant" },
  }),
  trigger: css({
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    width: "9",
    height: "full",
    color: "onSurfaceVariant",
    cursor: "pointer",
    fontSize: "md",
    backgroundColor: "transparent",
    borderWidth: "0",
    "&:hover": { color: "onSurface" },
    "&:focus-visible": {
      outlineWidth: "2px",
      outlineStyle: "solid",
      outlineColor: "primary",
      outlineOffset: "-2px",
    },
    "&:disabled": { cursor: "not-allowed" },
    "& svg": { width: "1em", height: "1em" },
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
 * MD3 combobox. Provide options with `qui-option` children or a `collection`
 * property.
 */
@Component({
  tag: "qui-combobox",
  styleUrl: resolveVar(styleUrls.quiCombobox),
  scoped: true,
  formAssociated: true,
})
export class QuiCombobox {
  @Element() host!: HTMLQuiComboboxElement;
  // oxlint-disable-next-line eslint/new-cap
  @AttachInternals() internals!: ElementInternals;

  /** A prepared Zag collection. Property-only. */
  @Prop() collection?: ListCollection<OptionData>;
  /** The controlled selected values. Property-only. */
  @Prop() value?: string[];
  /** The initial selected values. Property-only. */
  @Prop() defaultValue?: string[];
  /** The controlled input value. */
  @Prop() inputValue?: string;
  /** The initial input value. */
  @Prop() defaultInputValue = "";
  /** The form field name. */
  @Prop() name?: string;
  /** Placeholder text. */
  @Prop() placeholder?: string;
  /** Disables the combobox. */
  @Prop() disabled = false;
  /** Marks the combobox invalid. */
  @Prop() invalid = false;
  /** Makes the combobox read-only. */
  @Prop() readOnly = false;
  /** Marks the combobox required. */
  @Prop() required = false;
  /** Allows multiple selected values. */
  @Prop() multiple = false;
  /** Whether selecting an item closes the menu. */
  @Prop() closeOnSelect?: boolean;
  /** Whether the list opens on input click. */
  @Prop() openOnClick = false;
  /** Whether the list opens while typing. */
  @Prop() openOnChange?: boolean;
  /** Whether custom input values are allowed. */
  @Prop() allowCustomValue = false;
  /** Whether keyboard navigation wraps. */
  @Prop() loopFocus?: boolean;
  /** Input suggestion behavior. */
  @Prop() inputBehavior: "autohighlight" | "autocomplete" | "none" = "autohighlight";
  /** Selection behavior. */
  @Prop() selectionBehavior: "clear" | "replace" | "preserve" = "replace";
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

  /** Emitted whenever the input value changes. */
  @Event({ eventName: "inputvaluechange", bubbles: true, composed: true })
  inputValueChange!: EventEmitter<InputValueChangeDetails>;

  /** Emitted whenever the menu opens or closes. */
  @Event({ eventName: "openchange", bubbles: true, composed: true })
  openChange!: EventEmitter<OpenChangeDetails>;

  private formDisabled = false;

  private machine?: VanillaMachine<ComboboxSchema>;
  private unsubscribe?: () => void;
  private field?: FieldApi;
  private fieldUnsubscribe?: () => void;
  private observer?: MutationObserver;
  private spreads: (() => void)[] = [];
  private rootEl?: HTMLDivElement;
  private controlEl?: HTMLDivElement;
  private inputEl?: HTMLInputElement;
  private triggerEl?: HTMLButtonElement;
  private positionerEl?: HTMLDivElement;
  private contentEl?: HTMLDivElement;
  private initialValue: string[] = [];
  private lastFormSignature = "";
  private renderedItems: readonly OptionData[] = [];
  private readonly generatedId = nextId("qui-combobox");

  public componentWillLoad(): void {
    this.initialValue = [...(this.defaultValue ?? this.value ?? [])];
    this.attachField();
    this.machine = new VanillaMachine(comboboxMachine, () => this.machineProps());
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
    this.applySpreads(this.api);
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
  @Watch("inputValue")
  @Watch("name")
  @Watch("disabled")
  @Watch("invalid")
  @Watch("readOnly")
  @Watch("required")
  @Watch("multiple")
  @Watch("closeOnSelect")
  @Watch("openOnClick")
  @Watch("openOnChange")
  @Watch("allowCustomValue")
  @Watch("loopFocus")
  @Watch("inputBehavior")
  @Watch("selectionBehavior")
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

  private machineProps(): ComboboxProps<OptionData> {
    const { field } = this;
    return {
      id: this.host.id || this.generatedId,
      getRootNode: () => getRootNode(this.host),
      collection: this.buildCollection(),
      value: this.value,
      defaultValue: this.defaultValue,
      inputValue: this.inputValue,
      defaultInputValue: this.defaultInputValue,
      name: this.name,
      placeholder: this.placeholder,
      disabled: this.formDisabled || (field?.disabled() ?? this.disabled),
      invalid: field?.invalid() ?? this.invalid,
      readOnly: field?.readOnly() ?? this.readOnly,
      required: field?.required() ?? this.required,
      multiple: this.multiple,
      closeOnSelect: this.closeOnSelect,
      openOnClick: this.openOnClick,
      openOnChange: this.openOnChange,
      allowCustomValue: this.allowCustomValue,
      loopFocus: this.loopFocus,
      inputBehavior: this.inputBehavior,
      selectionBehavior: this.selectionBehavior,
      open: this.open,
      defaultOpen: this.defaultOpen,
      positioning: this.positioning ?? defaultPositioning,
      dir: this.textDirection,
      ids: field === undefined ? undefined : { input: field.ids.control, label: field.ids.label },
      scrollToIndexFn: (details: ScrollToIndexDetails) => {
        details.getElement()?.scrollIntoView({ block: "nearest" });
      },
      onValueChange: (details) => {
        this.valueChange.emit(details);
      },
      onInputValueChange: (details) => {
        this.inputValueChange.emit(details);
      },
      onOpenChange: (details) => {
        this.openChange.emit(details);
      },
    };
  }

  private visibleCollection(
    api: ComboboxApi<PropTypes, OptionData> = this.api,
  ): ListCollection<OptionData> {
    const full = api.collection;
    const query = api.inputValue.trim().toLowerCase();
    if (query === "") {
      return full;
    }
    const filtered = full.items.filter((item) => item.label.toLowerCase().includes(query));
    return full.copy(filtered);
  }

  private inputProps(api: ComboboxApi<PropTypes, OptionData>): Record<string, unknown> {
    const input = api.getInputProps();
    const {
      name: _name,
      required: _required,
      ...inputProps
    } = this.field === undefined
      ? input
      : {
          ...input,
          "aria-describedby": this.field.getInputProps()["aria-describedby"],
          "aria-errormessage": this.field.getInputProps()["aria-errormessage"],
        };
    return inputProps;
  }

  private get api(): ComboboxApi<PropTypes, OptionData> {
    if (this.machine === undefined) {
      throw new Error("qui-combobox has not been initialized");
    }
    return comboboxConnect<PropTypes, OptionData>(this.machine.service, normalizeProps);
  }

  private applySpreads(api: ComboboxApi<PropTypes, OptionData>): void {
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
    if (this.inputEl !== undefined) {
      this.spreads.push(
        spreadProps(this.inputEl, { ...this.inputProps(api), class: styles.input }),
      );
    }
    if (this.triggerEl !== undefined) {
      this.spreads.push(
        spreadProps(this.triggerEl, { ...api.getTriggerProps(), class: styles.trigger }),
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

  private formKey(values: readonly string[]): string {
    return `${this.name ?? ""}\u0001${this.multiple}\u0001${this.isRequired}\u0001${this.isInvalid}\u0001${values.join("\u0000")}`;
  }

  private syncFormState(api: ComboboxApi<PropTypes, OptionData> = this.api): void {
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
      this.internals.setValidity({ valueMissing: true }, "Please select an option.", this.inputEl);
      return;
    }
    if (this.isInvalid) {
      this.internals.setValidity({ customError: true }, "Invalid value", this.inputEl);
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

  private applyItemSpreads(api: ComboboxApi<PropTypes, OptionData>): void {
    if (this.contentEl === undefined || this.contentEl.hidden === true) {
      return;
    }
    const { renderedItems: items } = this;
    for (const element of this.contentEl.querySelectorAll<HTMLElement>(
      "[data-qui-combobox-item]",
    )) {
      const index = Number(element.dataset.index);
      const item = items.at(index);
      if (item !== undefined) {
        this.spreadItem(api, element, item);
      }
    }
  }

  private spreadItem(
    api: ComboboxApi<PropTypes, OptionData>,
    element: HTMLElement,
    item: OptionData,
  ): void {
    this.spreads.push(
      spreadProps(element, {
        ...api.getItemProps({ item }),
        class: listStyles.item,
      }),
    );
    const textEl = element.querySelector<HTMLElement>("[data-qui-combobox-item-text]");
    if (textEl !== null) {
      this.spreads.push(
        spreadProps(textEl, {
          ...api.getItemTextProps({ item }),
          class: listStyles.itemText,
        }),
      );
    }
    const indicatorEl = element.querySelector<HTMLElement>("[data-qui-combobox-item-indicator]");
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
    const { open } = api;
    const collectionItems: readonly OptionData[] = this.visibleCollection(api).items;
    this.renderedItems = collectionItems;

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
          <div
            ref={(el) => {
              if (el instanceof HTMLDivElement) {
                this.controlEl = el;
              }
            }}
            class={styles.control}
            part="control"
          >
            <input
              ref={(el) => {
                if (el instanceof HTMLInputElement) {
                  this.inputEl = el;
                }
              }}
              class={styles.input}
              part="input"
            />
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
              <UnfoldMoreIcon />
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
                    data-qui-combobox-item=""
                    data-index={index}
                    class={listStyles.item}
                  >
                    <span data-qui-combobox-item-text="" class={listStyles.itemText}>
                      {item.label}
                    </span>
                    <span data-qui-combobox-item-indicator="" class={listStyles.itemIndicator}>
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

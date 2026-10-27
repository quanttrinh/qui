import {
  AttachInternals,
  Component,
  Element,
  Event,
  forceUpdate,
  h,
  Host,
  Method,
  Prop,
  resolveVar,
  Watch,
  type EventEmitter,
  type VNode,
} from "@stencil/core";

import { styleUrls } from "#qui-style-url";

import { ariaAttr, dataAttr } from "../../helpers/attr";
import { isHTMLInputElement, isNode } from "../../helpers/dom";
import { nextId } from "../../helpers/id";
import { ensureShadowStylesheet } from "../../utilities/styles";
import { UnfoldMoreIcon } from "../qui-icon/icons";
import { quiOptionSource } from "../qui-option/option-source";
import { type PopoverDismissEvent } from "../qui-popover/qui-popover";
import {
  FormController,
  OptionListNavigationController,
  ListWindowController,
  OptionSourceController,
  SelectionController,
} from "../shared/controllers";
import { applyFieldAria } from "../shared/field/aria";
import { createFieldControl, focusElement } from "../shared/field/control";
import { OptionControlBase } from "../shared/option/component-base";
import { labelForValue, type OptionItem } from "../shared/option/option";
import {
  PANEL_MAX_HEIGHT,
  listStyles,
  renderOptionList,
  renderOptionRow,
} from "../shared/option/option-list";
import { ComboboxInputController } from "./input-controller";
import { type ComboboxFilter, type ComboboxFilterMode, type ComboboxOption } from "./model";
import { comboboxStyles as styles } from "./styles";

/** Emitted whenever the selected values change. */
export interface ComboboxValueChangeDetails {
  value: string[];
  items: ComboboxOption[];
}

/** Emitted whenever the input value changes. */
export interface ComboboxInputValueChangeDetails {
  inputValue: string;
  reason: string;
}

/** Emitted whenever the list opens or closes. */
export interface ComboboxOpenChangeDetails {
  open: boolean;
  reason: string;
}

function displayValueFor(
  items: readonly OptionItem[],
  values: readonly string[],
  multiple: boolean,
): string {
  if (multiple) {
    return "";
  }
  const value = values.at(0);
  return value === undefined ? "" : labelForValue(items, value);
}

/**
 * MD3 combobox built on the native popover API. Provide options with
 * `qui-option` children or an `items` property.
 *
 * The list renders in the top layer with `popover="manual"` and is positioned
 * with JavaScript, so it does not depend on CSS anchor positioning.
 */
@Component({
  tag: "qui-combobox",
  styleUrl: resolveVar(styleUrls.quiCombobox),
  shadow: true,
  formAssociated: true,
})
export class QuiCombobox extends OptionControlBase {
  @Element() host!: HTMLQuiComboboxElement;
  @AttachInternals() internals!: ElementInternals;

  /** The controlled input value. */
  @Prop() inputValue?: string;
  /** The initial input value. */
  @Prop() defaultInputValue = "";
  /** Placeholder text. */
  @Prop() placeholder?: string;
  /** Whether clicking the input opens the list. */
  @Prop() openOnClick = false;
  /** Whether typing opens the list. Defaults to `true`. */
  @Prop() openOnChange?: boolean;
  /** Whether custom input values are committed as selections. */
  @Prop() allowCustomValue = false;
  /** Whether keyboard navigation wraps around. Defaults to `true`. */
  @Prop() loopFocus?: boolean;
  /**
   * Custom matcher for the visible options. Property-only. Receives each item
   * and the trimmed input value, and returns whether the item should be shown.
   */
  @Prop() filter?: ComboboxFilter;
  /**
   * Built-in matching strategy used when `filter` is not set. Set to `none`
   * when `items` is already filtered (for example by a server).
   */
  @Prop() filterMode: ComboboxFilterMode = "contains";
  /** Milliseconds to debounce query changes before filtering. */
  @Prop() filterDebounce = 0;
  /** Marks the option list as loading, e.g. while a remote query resolves. */
  @Prop() loading = false;
  /** Message shown when no option matches the current query. */
  @Prop() emptyText = "No results";
  /** Message shown while `loading` is set. */
  @Prop() loadingText = "Loading…";
  /** Emitted whenever the selected values change. */
  @Event({ eventName: "valuechange", bubbles: true, composed: true })
  valueChange!: EventEmitter<ComboboxValueChangeDetails>;

  /** Emitted whenever the input value changes. */
  @Event({ eventName: "inputvaluechange", bubbles: true, composed: true })
  inputValueChange!: EventEmitter<ComboboxInputValueChangeDetails>;

  /** Emitted whenever the list opens or closes. */
  @Event({ eventName: "openchange", bubbles: true, composed: true })
  openChange!: EventEmitter<ComboboxOpenChangeDetails>;

  private rootEl?: HTMLDivElement;
  private inputEl?: HTMLInputElement;
  private readonly generatedId = nextId("qui-combobox");
  private readonly listId = `${this.generatedId}-listbox`;
  private readonly fieldControl = createFieldControl(() => this.inputEl);
  private readonly form = new FormController({
    getHost: (): HTMLElement => this.host,
    getInternals: (): ElementInternals => this.internals,
    getName: (): string | undefined => this.name,
    getMultiple: (): boolean => this.multiple,
    getValue: (): string[] => this.selection.selected,
    getDisabled: (): boolean => this.disabled,
    getReadOnly: (): boolean => this.readOnly,
    getRequired: (): boolean => this.required,
    getInvalid: (): boolean => this.invalid,
    getValidationElement: (): HTMLElement | undefined => this.inputEl,
    onReset: (): void => {
      this.selection.reset();
      this.navigation.closeMenu("reset");
      this.window.scrollToStart();
      this.input.setTextSilently(
        displayValueFor(this.source.items, this.selection.selected, this.multiple),
      );
    },
    onRestore: (values: string[]): void => {
      this.selection.restore(values);
      this.input.setTextSilently(
        displayValueFor(this.source.items, this.selection.selected, this.multiple),
      );
    },
    requestUpdate: (): void => {
      forceUpdate(this.host);
    },
  });

  protected get formController(): FormController {
    return this.form;
  }
  private readonly source = new OptionSourceController({
    adapter: quiOptionSource,
    getHost: (): HTMLElement => this.host,
    getItems: (): readonly ComboboxOption[] | undefined => this.items,
    getRenderedRoot: (): HTMLElement | undefined => this.rootEl,
    requestUpdate: (): void => {
      forceUpdate(this.host);
    },
    onInvalidate: (): void => {
      this.invalidateFilter();
    },
  });
  private readonly selection = new SelectionController({
    getValue: (): string[] | undefined => this.value,
    getDefaultValue: (): string[] | undefined => this.defaultValue,
    getItems: (): readonly ComboboxOption[] => this.source.items,
    getMultiple: (): boolean => this.multiple,
    getDeselectable: (): boolean => false,
    isReadOnly: (): boolean => this.form.isReadOnly,
    onChange: ({ value, items }): void => {
      this.valueChange.emit({ value, items });
      this.form.sync();
    },
    requestUpdate: (): void => {
      forceUpdate(this.host);
    },
  });
  private readonly window = new ListWindowController({
    getEstimateSize: (): number => this.estimateSize,
    fallbackViewportSize: PANEL_MAX_HEIGHT,
    getOverscan: (): number => this.overscan,
    requestUpdate: (): void => {
      forceUpdate(this.host);
    },
  });
  private readonly navigation = new OptionListNavigationController<ComboboxOption>({
    getItems: (): readonly ComboboxOption[] => this.visibleItems(this.source.items),
    getInitialActive: (): string | undefined => {
      const items = this.visibleItems(this.source.items);
      const selected = new Set(this.selection.selected);
      return (
        items.find((item) => selected.has(item.value) && !item.disabled)?.value ??
        items.find((item) => !item.disabled)?.value
      );
    },
    isDisabled: (): boolean => this.form.isDisabled,
    isReadOnly: (): boolean => this.form.isReadOnly,
    isLooping: (): boolean => this.loopFocus !== false,
    onOpenChange: (open: boolean, reason: string): void => {
      this.openChange.emit({ open, reason });
    },
    onReveal: (index: number): void => {
      this.window.revealIndex(index);
    },
    requestUpdate: (): void => {
      forceUpdate(this.host);
    },
  });

  private readonly input = new ComboboxInputController({
    getControlledValue: (): string | undefined => this.inputValue,
    getFilter: (): ComboboxFilter | undefined => this.filter,
    getFilterMode: (): ComboboxFilterMode => this.filterMode,
    getFilterDebounce: (): number => this.filterDebounce,
    onInputValueChange: (value: string, reason: string): void => {
      this.inputValueChange.emit({ inputValue: value, reason });
    },
    onQueryApplied: (): void => {
      this.window.scrollToStart();
      if (this.navigation.open) {
        this.navigation.edge("first");
      }
    },
    requestUpdate: (): void => {
      forceUpdate(this.host);
    },
  });

  constructor() {
    super();
    this.addController(this.form);
    this.addController(this.source);
    this.addController(this.selection);
    this.addController(this.window);
    this.addController(this.navigation);
    this.form.setControl(this.fieldControl);
  }

  public connectedCallback(): void {
    super.connectedCallback();
    ensureShadowStylesheet(this.host);
  }

  public componentWillLoad(): void {
    super.componentWillLoad();
    this.input.initialize(this.defaultInputValue);
    if (this.open ?? this.defaultOpen) {
      this.navigation.openMenu("initial");
    }
  }

  public componentDidLoad(): void {
    super.componentDidLoad();
    this.syncInitialInput();
    this.form.sync();
  }

  public componentDidRender(): void {
    super.componentDidRender();
    applyFieldAria(this.inputEl, this.form.fieldApi);
  }

  public disconnectedCallback(): void {
    super.disconnectedCallback();
    this.input.dispose();
  }

  /** Moves focus to the internal input. */
  @Method()
  public async focusControl(options?: FocusOptions): Promise<void> {
    await focusElement(this.inputEl, options);
  }

  @Watch("value")
  private syncControlledValue(): void {
    this.form.sync();
    if (this.inputValue === undefined && !this.multiple && !this.navigation.open) {
      this.input.setTextSilently(
        displayValueFor(this.source.items, this.selection.selected, this.multiple),
      );
    }
  }

  @Watch("inputValue")
  private syncControlledInput(value?: string): void {
    this.input.syncControlled(value ?? "");
  }

  @Watch("open")
  private syncControlledOpen(value?: boolean): void {
    if (value === undefined || value === this.navigation.open) {
      return;
    }
    if (value) {
      this.navigation.openMenu("prop");
      return;
    }
    this.closeMenu("prop", true);
  }

  @Watch("items")
  private invalidateItems(): void {
    this.source.invalidate();
    this.input.invalidate();
  }

  @Watch("filter")
  @Watch("filterMode")
  private invalidateFilter(): void {
    this.input.invalidate();
  }

  private get inputText(): string {
    return this.input.value;
  }

  private visibleItems(items: readonly ComboboxOption[]): readonly ComboboxOption[] {
    return this.input.filter(items);
  }

  private syncInitialInput(): void {
    if (this.inputValue !== undefined || this.defaultInputValue !== "") {
      return;
    }
    this.input.setTextSilently(
      displayValueFor(this.source.items, this.selection.selected, this.multiple),
    );
  }

  private setInput(value: string, reason?: string): void {
    this.input.setText(value, reason);
  }

  private readonly handleInput = (event: Event): void => {
    const input = event.target;
    if (!isHTMLInputElement(input)) {
      return;
    }
    this.input.handleInput(input.value);
    if (this.openOnChange !== false) {
      this.openMenu("input");
    }
  };

  private readonly handleInputClick = (): void => {
    if (this.openOnClick && !this.navigation.open) {
      this.openMenu("input-click");
    }
  };

  private readonly handleTriggerClick = (): void => {
    if (this.form.isDisabled || this.form.isReadOnly) {
      return;
    }
    if (this.navigation.open) {
      this.closeMenu("trigger", true);
      return;
    }
    this.openMenu("trigger");
    this.inputEl?.focus();
  };

  private readonly handleFocusOut = (event: FocusEvent): void => {
    const next = event.relatedTarget;
    // Focus moves within the combobox (input → trigger or listbox) are internal.
    // Check the shadow root: host.contains() cannot see internal elements.
    if (isNode(next) && (this.host.contains(next) || (this.rootEl?.contains(next) ?? false))) {
      return;
    }
    if (!this.navigation.open) {
      return;
    }
    this.commitCustomValue();
    this.closeMenu("blur", false);
  };

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    if (this.form.isDisabled || this.form.isReadOnly) {
      return;
    }
    if (this.navigation.handleNavigationKey({ event })) {
      return;
    }
    switch (event.key) {
      case "Enter": {
        this.handleEnter(event);
        break;
      }
      case "Escape": {
        if (this.navigation.open) {
          event.preventDefault();
          this.closeMenu("escape", true);
        }
        break;
      }
      case "Tab": {
        this.commitCustomValue();
        this.closeMenu("tab", false);
        break;
      }
      default: {
        break;
      }
    }
  };

  private handleEnter(event: KeyboardEvent): void {
    const active = this.navigation.activeValue;
    if (active !== undefined) {
      event.preventDefault();
      this.select(active);
      return;
    }
    if (this.allowCustomValue) {
      event.preventDefault();
      this.commitCustomValue();
      this.closeMenu("enter", false);
    }
  }

  private openMenu(reason: string): void {
    this.navigation.openMenu(reason);
  }

  private closeMenu(reason: string, restoreInput: boolean): void {
    if (!this.navigation.open) {
      return;
    }
    this.navigation.closeMenu(reason);
    this.window.scrollToStart();
    const display = displayValueFor(this.source.items, this.selection.selected, this.multiple);
    if (restoreInput || (!this.allowCustomValue && this.inputText !== display)) {
      this.setInput(display, reason);
    } else if (this.multiple) {
      this.setInput("", reason);
    }
    this.input.resetQuery();
  }

  private select(value: string): void {
    const item = this.selection.select(value);
    if (item === undefined) {
      return;
    }
    if (this.multiple) {
      this.setInput("", "select");
      this.input.resetQuery();
    } else {
      this.setInput(item.label, "select");
      this.input.resetQuery();
      if (this.closeOnSelect !== false) {
        this.closeMenu("select", false);
      }
    }
  }

  private commitCustomValue(): void {
    const text = this.inputText.trim();
    if (!this.allowCustomValue || text === "") {
      return;
    }
    const match = this.source.items.find((item) => item.label.toLowerCase() === text.toLowerCase());
    const value = match?.value ?? text;
    if (this.selection.selected.includes(value)) {
      return;
    }
    const next = this.multiple ? [...this.selection.selected, value] : [value];
    this.selection.apply(next);
    if (!this.multiple) {
      this.setInput(match?.label ?? text, "custom");
    }
  }

  private readonly handleDismiss = (event: CustomEvent<PopoverDismissEvent>): void => {
    if (event.detail.reason === "outside") {
      this.commitCustomValue();
    }
    this.closeMenu(event.detail.reason, event.detail.reason === "escape");
  };

  private statusText(total: number): string {
    if (this.loading) {
      return this.loadingText;
    }
    if (total === 0) {
      return this.emptyText;
    }
    return `${total} ${total === 1 ? "result" : "results"}`;
  }

  public render(): VNode {
    const items = this.visibleItems(this.source.items);
    const list = this.window.getList(items);
    const { total } = list;
    const { selected } = this.selection;
    const selectedValues = new Set(selected);
    const { activeValue } = this.navigation;
    const { open: isOpen } = this.navigation;
    const { isDisabled, isReadOnly, isInvalid, isRequired } = this.form;
    const activeIndex = isOpen ? items.findIndex((item) => item.value === activeValue) : -1;
    const activeDescendant = activeIndex === -1 ? undefined : `${this.listId}-${activeIndex}`;
    const { fieldApi: field } = this.form;

    return (
      <Host class={styles.host}>
        <div
          ref={(el) => {
            this.rootEl = el;
          }}
          class={styles.root}
          part="root"
          dir={this.textDirection}
          onFocusout={this.handleFocusOut}
        >
          <div
            class={styles.control}
            part="control"
            data-disabled={dataAttr(isDisabled)}
            data-invalid={dataAttr(isInvalid)}
          >
            <input
              ref={(el) => {
                this.inputEl = el;
              }}
              id={field?.ids.control ?? (this.host.id || this.generatedId)}
              class={styles.input}
              part="input"
              role="combobox"
              type="text"
              autocomplete="off"
              spellcheck={false}
              placeholder={this.placeholder}
              value={this.inputText}
              disabled={isDisabled}
              readOnly={isReadOnly}
              aria-autocomplete="list"
              aria-haspopup="listbox"
              aria-controls={this.listId}
              aria-expanded={isOpen ? "true" : "false"}
              aria-activedescendant={isOpen ? activeDescendant : undefined}
              aria-invalid={ariaAttr(isInvalid)}
              aria-required={ariaAttr(isRequired)}
              onInput={this.handleInput}
              onClick={this.handleInputClick}
              onKeyDown={this.handleKeyDown}
            />
            <button
              class={styles.trigger}
              part="trigger"
              type="button"
              tabIndex={-1}
              aria-label="Toggle options"
              aria-haspopup="listbox"
              aria-expanded={isOpen ? "true" : "false"}
              aria-controls={this.listId}
              disabled={isDisabled || isReadOnly}
              onClick={this.handleTriggerClick}
            >
              <UnfoldMoreIcon />
            </button>
          </div>

          {renderOptionList({
            list,
            listId: this.listId,
            open: isOpen,
            multiple: this.multiple,
            status: this.statusText(total),
            viewportRef: (el) => {
              this.window.setViewport(el);
            },
            onDismiss: this.handleDismiss,
            onScroll: () => {
              this.window.handleScroll();
            },
            renderItem: (entry) =>
              renderOptionRow({
                entry,
                listId: this.listId,
                total,
                activeValue,
                selected: selectedValues.has(entry.item.value),
                optionRender: this.optionRender,
                onSelect: (value) => {
                  this.select(value);
                },
                onHighlight: (value) => {
                  this.navigation.setActive(value);
                },
              }),
            renderEmpty: () =>
              this.loading ? (
                <div class={listStyles.empty} part="loading">
                  {this.loadingText}
                </div>
              ) : (
                <div class={listStyles.empty} part="empty">
                  {this.emptyText}
                </div>
              ),
          })}
        </div>
      </Host>
    );
  }
}

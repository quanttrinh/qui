import {
  Mixin,
  AttachInternals,
  Component,
  Element,
  Event,
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

import { ensureShadowStylesheet } from "../../utilities/styles";
import { UnfoldMoreIcon } from "../qui-icon/icons";
import { quiOptionSource } from "../qui-option/option-source";
import {
  FormController,
  OptionListNavigationController,
  ListWindowController,
  OptionSourceController,
  SelectionController,
} from "../shared/controllers";
import { ariaAttr, dataAttr } from "../shared/helpers/aria/attr";
import { focusElement } from "../shared/helpers/dom/focus";
import { nextId } from "../shared/helpers/dom/id";
import { applyFieldAria, createFieldControl } from "../shared/helpers/field";
import {
  PANEL_MAX_HEIGHT,
  labelForValue,
  listStyles,
  renderOptionList,
  renderOptionRow,
  type OptionItem,
} from "../shared/helpers/option";
import { ControllerHostMixin, FormControlMixin, OptionControlMixin } from "../shared/mixins";
import { selectStyles as styles } from "./styles";

/** A select option. */
export type SelectOption = OptionItem;

/** Emitted whenever the selected values change. */
export interface SelectValueChangeDetails {
  value: string[];
  items: SelectOption[];
}

/** Emitted whenever the list opens or closes. */
export interface SelectOpenChangeDetails {
  open: boolean;
  reason: string;
}

function labelsForValues(
  items: readonly OptionItem[],
  values: readonly string[],
  separator = ", ",
): string {
  return values.map((value) => labelForValue(items, value)).join(separator);
}

/**
 * MD3 select. Provide options with `qui-option` children or an `items`
 * property. The list and popover are shared with `qui-combobox`.
 * @undefinedContent
 */
@Component({
  tag: "qui-select",
  styleUrl: resolveVar(styleUrls.quiSelect),
  shadow: true,
  formAssociated: true,
})
export class QuiSelect extends Mixin(ControllerHostMixin, FormControlMixin, OptionControlMixin) {
  @Element() host!: HTMLQuiSelectElement;
  @AttachInternals() internals!: ElementInternals;

  /** Trigger text when no value is selected. */
  @Prop() placeholder = "Select an option";
  /** Whether keyboard navigation wraps. */
  @Prop() loopFocus = false;
  /** Whether selecting the current value clears it. */
  @Prop() deselectable = false;
  /** Message shown when there are no options. */
  @Prop() emptyText = "No options";

  /** Emitted whenever the selected values change. */
  @Event({ eventName: "valuechange", bubbles: true, composed: true })
  valueChange!: EventEmitter<SelectValueChangeDetails>;

  /** Emitted whenever the list opens or closes. */
  @Event({ eventName: "openchange", bubbles: true, composed: true })
  openChange!: EventEmitter<SelectOpenChangeDetails>;

  private rootEl?: HTMLDivElement;
  private triggerEl?: HTMLButtonElement;
  private typeahead = "";
  private typeaheadTimer?: ReturnType<typeof setTimeout>;
  private readonly generatedId = nextId("qui-select");
  private readonly listId = `${this.generatedId}-listbox`;
  private readonly fieldControl = createFieldControl(() => this.triggerEl);
  protected readonly form = new FormController(this, {
    getInternals: (): ElementInternals => this.internals,
    getName: (): string | undefined => this.name,
    getMultiple: (): boolean => this.multiple,
    getValue: (): string[] => this.selection.selected,
    getDisabled: (): boolean => this.disabled,
    getReadOnly: (): boolean => this.readOnly,
    getRequired: (): boolean => this.required,
    getInvalid: (): boolean => this.invalid,
    getValidationElement: (): HTMLElement | undefined => this.triggerEl,
    onReset: (): void => {
      this.selection.reset();
      this.navigation.closeMenu("reset");
      this.window.scrollToStart();
    },
    onRestore: (values: string[]): void => {
      this.selection.restore(values);
    },
  });

  private readonly source = new OptionSourceController(this, {
    adapter: quiOptionSource,
    getItems: (): readonly SelectOption[] | undefined => this.items,
    getRenderedRoot: (): HTMLElement | undefined => this.rootEl,
  });
  private readonly selection = new SelectionController(this, {
    getValue: (): string[] | undefined => this.value,
    getDefaultValue: (): string[] | undefined => this.defaultValue,
    getItems: (): readonly SelectOption[] => this.source.items,
    getMultiple: (): boolean => this.multiple,
    getDeselectable: (): boolean => this.deselectable,
    isReadOnly: (): boolean => this.form.isReadOnly,
    onChange: ({ value, items }): void => {
      this.valueChange.emit({ value, items });
      this.form.sync();
    },
  });
  private readonly window = new ListWindowController(this, {
    getEstimateSize: (): number => this.estimateSize,
    fallbackViewportSize: PANEL_MAX_HEIGHT,
    getOverscan: (): number => this.overscan,
  });
  private readonly navigation = new OptionListNavigationController<SelectOption>(this, {
    getItems: (): readonly SelectOption[] => this.source.items,
    getInitialActive: (): string | undefined => {
      const { items } = this.source;
      const selected = new Set(this.selection.selected);
      return (
        items.find((item) => selected.has(item.value) && !item.disabled)?.value ??
        items.find((item) => !item.disabled)?.value
      );
    },
    getOpen: (): boolean | undefined => this.open,
    getDefaultOpen: (): boolean => this.defaultOpen,
    isDisabled: (): boolean => this.form.isDisabled,
    isReadOnly: (): boolean => this.form.isReadOnly,
    isLooping: (): boolean => this.loopFocus,
    onOpenChange: (open: boolean, reason: string): void => {
      this.openChange.emit({ open, reason });
    },
    onReveal: (index: number): void => {
      this.window.revealIndex(index);
    },
  });

  constructor() {
    super();
    this.form.setControl(this.fieldControl);
  }

  connectedCallback(): void {
    super.connectedCallback();
    ensureShadowStylesheet(this.host);
  }

  componentDidRender(): void {
    super.componentDidRender();
    applyFieldAria(this.triggerEl, this.form.fieldApi);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this.typeaheadTimer !== undefined) {
      clearTimeout(this.typeaheadTimer);
      this.typeaheadTimer = undefined;
    }
  }

  /** Moves focus to the internal trigger button. */
  @Method()
  async focusControl(options?: FocusOptions): Promise<void> {
    await focusElement(this.triggerEl, options);
  }

  /** Returns the current selection, including uncontrolled changes. */
  @Method()
  // oxlint-disable-next-line eslint/require-await, typescript/require-await -- Stencil @Method requires async, but the selection is available synchronously.
  async getValue(): Promise<string[]> {
    return [...this.selection.selected];
  }

  @Watch("value")
  private syncForm(): void {
    this.form.sync();
  }

  @Watch("open")
  private syncControlledOpen(value?: boolean): void {
    if (value == null || value === this.navigation.open) {
      return;
    }
    if (value) {
      this.navigation.openMenu("prop");
      return;
    }
    this.closeMenu("prop");
  }

  private get valueText(): string {
    const values = this.selection.selected;
    return values.length === 0 ? this.placeholder : labelsForValues(this.source.items, values);
  }

  private closeMenu(reason: string): void {
    this.navigation.closeMenu(reason);
    this.window.scrollToStart();
  }

  private readonly handleTriggerClick = (): void => {
    if (this.form.isDisabled || this.form.isReadOnly) {
      return;
    }
    this.navigation.toggleMenu("trigger");
  };

  private readonly handleDismiss = (): void => {
    this.closeMenu("outside");
  };

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    if (this.form.isDisabled || this.form.isReadOnly) {
      return;
    }
    if (this.navigation.handleNavigationKey({ event })) {
      return;
    }
    switch (event.key) {
      case "Enter":
      case " ": {
        this.handleActivate(event);
        break;
      }
      case "Escape": {
        if (this.navigation.open) {
          event.preventDefault();
          this.closeMenu("escape");
        }
        break;
      }
      case "Tab": {
        this.closeMenu("tab");
        break;
      }
      default: {
        this.handleTypeahead(event);
        break;
      }
    }
  };

  private handleActivate(event: KeyboardEvent): void {
    event.preventDefault();
    if (!this.navigation.open) {
      this.navigation.openMenu("keyboard");
      return;
    }
    if (this.navigation.activeValue !== undefined) {
      this.select(this.navigation.activeValue);
    }
  }

  private handleTypeahead(event: KeyboardEvent): void {
    if (event.key.length !== 1 || event.ctrlKey || event.metaKey || event.altKey) {
      return;
    }
    this.typeahead += event.key.toLowerCase();
    if (this.typeaheadTimer !== undefined) {
      clearTimeout(this.typeaheadTimer);
    }
    this.typeaheadTimer = setTimeout(() => {
      this.typeahead = "";
      this.typeaheadTimer = undefined;
    }, 500);
    const match = this.navigation.findByPrefix(this.typeahead);
    if (match !== undefined) {
      if (!this.navigation.open) {
        this.navigation.openMenu("typeahead");
      }
      this.navigation.setActive(match.value);
    }
  }

  private select(value: string): void {
    const item = this.selection.select(value);
    if (item === undefined) {
      return;
    }
    if (!this.multiple && this.closeOnSelect !== false) {
      this.closeMenu("select");
    }
  }

  private activeDescendant(): string | undefined {
    if (!this.navigation.open || this.navigation.activeValue === undefined) {
      return undefined;
    }
    const index = this.source.items.findIndex((item) => item.value === this.navigation.activeValue);
    return index === -1 ? undefined : `${this.listId}-${index}`;
  }

  render(): VNode {
    const list = this.window.getList(this.source.items);
    const { selected } = this.selection;
    const selectedValues = new Set(selected);
    const status =
      list.total === 0
        ? this.emptyText
        : `${list.total} ${list.total === 1 ? "option" : "options"}`;
    const placeholderShown = selected.length === 0;

    return (
      <Host class={styles.host}>
        <div
          ref={(el) => {
            this.rootEl = el;
          }}
          class={styles.root}
          part="root"
          dir={this.textDirection}
        >
          <div class={styles.control} part="control">
            <button
              ref={(el) => {
                this.triggerEl = el;
              }}
              id={this.form.fieldApi?.ids.control ?? (this.host.id || this.generatedId)}
              class={styles.trigger}
              part="trigger"
              type="button"
              role="combobox"
              aria-haspopup="listbox"
              aria-controls={this.listId}
              aria-expanded={this.navigation.open ? "true" : "false"}
              aria-activedescendant={this.activeDescendant()}
              aria-invalid={ariaAttr(this.form.isInvalid)}
              aria-required={ariaAttr(this.form.isRequired)}
              data-placeholder-shown={dataAttr(placeholderShown)}
              data-invalid={dataAttr(this.form.isInvalid)}
              data-disabled={dataAttr(this.form.isDisabled)}
              disabled={this.form.isDisabled}
              onClick={this.handleTriggerClick}
              onKeyDown={this.handleKeyDown}
            >
              <span class={styles.valueText} part="value-text">
                {this.valueText}
              </span>
              <span
                class={styles.indicator}
                part="indicator"
                data-state={this.navigation.open ? "open" : "closed"}
              >
                <UnfoldMoreIcon />
              </span>
            </button>
          </div>

          {renderOptionList({
            list,
            listId: this.listId,
            open: this.navigation.open,
            multiple: this.multiple,
            status,
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
                total: list.total,
                activeValue: this.navigation.activeValue,
                selected: selectedValues.has(entry.item.value),
                optionRender: this.optionRender,
                onSelect: (value) => {
                  this.select(value);
                },
                onHighlight: (value) => {
                  this.navigation.setActive(value);
                },
              }),
            renderEmpty: () => (
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

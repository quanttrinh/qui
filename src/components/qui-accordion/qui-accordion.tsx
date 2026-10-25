import {
  resolveVar,
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

import { styleUrls } from "#qui-style-url";
import { css, cx } from "#styled-system/css";

import { nextId } from "../../helpers/id";
import { ReactiveControlBase } from "../shared/reactive-control/component-base";
import { clearAccordion, provideAccordion, type AccordionContext } from "./accordion-context";
import { AccordionController } from "./controller";

const styles = {
  host: css({ display: "block", width: "full" }),
  root: css({
    width: "full",
    borderWidth: "1px",
    borderColor: "outlineVariant",
    rounded: "xl",
    backgroundColor: "surface",
    overflow: "hidden",
  }),
};

/** Emitted whenever the expanded values change. */
export interface AccordionValueChangeDetails {
  value: string[];
}

/**
 * MD3 accordion. Compose with `qui-accordion-item`, `qui-accordion-trigger`, and
 * `qui-accordion-content`.
 *
 * @slot - Accordion items.
 */
@Component({
  tag: "qui-accordion",
  styleUrl: resolveVar(styleUrls.quiAccordion),
  scoped: true,
})
export class QuiAccordion extends ReactiveControlBase {
  @Element() host!: HTMLQuiAccordionElement;

  /** Whether multiple items may be expanded at once. */
  @Prop() multiple = false;
  /** Whether an expanded item may be collapsed. */
  @Prop() collapsible = false;
  /** The controlled expanded values. Property-only. */
  @Prop() value?: string[];
  /** The initial expanded values. Property-only. */
  @Prop() defaultValue?: string[];
  /** Disables every item. */
  @Prop() disabled = false;
  /** Layout orientation. */
  @Prop() orientation: "horizontal" | "vertical" = "vertical";
  /** Text direction. */
  @Prop() textDirection?: "ltr" | "rtl";
  /** Additional class applied to the root element. */
  @Prop() innerClass?: string;

  /** Emitted whenever the expanded values change. */
  @Event({ eventName: "valuechange", bubbles: true, composed: true })
  valueChange!: EventEmitter<AccordionValueChangeDetails>;

  private idBase = "";
  private readonly listeners = new Set<() => void>();
  private readonly generatedId = nextId("qui-accordion");
  private readonly controller = new AccordionController({
    getHost: (): HTMLElement => this.host,
    getValue: (): string[] | undefined => this.value,
    getDefaultValue: (): string[] | undefined => this.defaultValue,
    getMultiple: (): boolean => this.multiple,
    getCollapsible: (): boolean => this.collapsible,
    getTriggerId: (value: string): string => this.triggerId(value),
    onChange: (value: string[]): void => {
      this.valueChange.emit({ value });
    },
    requestUpdate: (): void => {
      forceUpdate(this.host);
      this.notifyListeners();
    },
  });
  private readonly context: AccordionContext = {
    value: (): string[] => this.controller.value,
    focusedValue: (): string | undefined => this.controller.focusedValue,
    isExpanded: (value: string): boolean => this.controller.value.includes(value),
    isFocused: (value: string): boolean => this.controller.focusedValue === value,
    isDisabled: (): boolean => this.disabled,
    orientation: (): "horizontal" | "vertical" => this.orientation,
    textDirection: (): "ltr" | "rtl" | undefined => this.textDirection,
    toggle: (value: string): void => {
      this.controller.toggle(value);
    },
    focus: (value: string): void => {
      this.controller.focus(value);
    },
    blur: (): void => {
      this.controller.blur();
    },
    move: (fromValue: string, delta: 1 | -1): void => {
      this.controller.move(fromValue, delta);
    },
    edge: (edge: "first" | "last"): void => {
      this.controller.edge(edge);
    },
    rootId: (): string => this.rootId,
    itemId: (value: string): string => this.itemId(value),
    triggerId: (value: string): string => this.triggerId(value),
    contentId: (value: string): string => this.contentId(value),
    subscribe: (listener: () => void): (() => void) => {
      this.listeners.add(listener);
      return (): void => {
        this.listeners.delete(listener);
      };
    },
  };

  constructor() {
    super();
    this.addController(this.controller);
  }

  public connectedCallback(): void {
    super.connectedCallback();
    if (this.idBase === "") {
      this.idBase = this.host.id || this.generatedId;
    }
    provideAccordion(this.host, this.context);
  }

  public componentWillLoad(): void {
    super.componentWillLoad();
    this.idBase = this.host.id || this.generatedId;
    provideAccordion(this.host, this.context);
  }

  public disconnectedCallback(): void {
    super.disconnectedCallback();
    clearAccordion(this.host);
    this.listeners.clear();
  }

  @Watch("multiple")
  @Watch("collapsible")
  @Watch("value")
  @Watch("disabled")
  @Watch("orientation")
  @Watch("textDirection")
  private syncContext(): void {
    forceUpdate(this.host);
    this.notifyListeners();
  }

  private get rootId(): string {
    return `accordion:${this.idBase || this.generatedId}`;
  }

  private itemId(value: string): string {
    return `${this.rootId}:item:${value}`;
  }

  private triggerId(value: string): string {
    return `${this.rootId}:trigger:${value}`;
  }

  private contentId(value: string): string {
    return `${this.rootId}:content:${value}`;
  }

  private notifyListeners(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }

  public render(): VNode {
    return (
      <Host class={styles.host}>
        <div
          id={this.rootId}
          data-scope="accordion"
          data-part="root"
          data-orientation={this.orientation}
          dir={this.textDirection}
          class={cx(styles.root, this.innerClass)}
          part="root"
        >
          <slot />
        </div>
      </Host>
    );
  }
}

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
import { css } from "#styled-system/css";

import { nextId } from "../../helpers/id";
import { ensureShadowStylesheet } from "../../utilities/styles";
import { createListenerStore } from "../shared/listener-store";
import { ReactiveControlBase } from "../shared/reactive-control/component-base";
import { clearAccordion, provideAccordion, type AccordionContext } from "./accordion-context";
import { AccordionController } from "./controller";

const styles = {
  host: css({ display: "block" }),
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
  shadow: true,
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

  /** Emitted whenever the expanded values change. */
  @Event({ eventName: "valuechange", bubbles: true, composed: true })
  valueChange!: EventEmitter<AccordionValueChangeDetails>;

  private idBase = "";
  private readonly listeners = createListenerStore();
  private readonly generatedId = nextId("qui-accordion");
  private readonly controller = new AccordionController({
    getValue: (): string[] | undefined => this.value,
    getDefaultValue: (): string[] | undefined => this.defaultValue,
    getMultiple: (): boolean => this.multiple,
    getCollapsible: (): boolean => this.collapsible,
    onChange: (value: string[]): void => {
      this.valueChange.emit({ value });
    },
    requestUpdate: (): void => {
      forceUpdate(this.host);
      this.listeners.notify();
    },
  });
  private readonly context: AccordionContext = {
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
    registerTrigger: (value: string, triggerHost: HTMLElement, trigger: HTMLButtonElement) =>
      this.controller.registerTrigger(value, triggerHost, trigger),
    registerContent: (value: string, contentHost: HTMLElement) =>
      this.controller.registerContent(value, contentHost),
    getTrigger: (value: string) => this.controller.getTrigger(value),
    getContent: (value: string): HTMLElement | undefined => this.controller.getContent(value),
    focusTrigger: (value: string): void => {
      this.controller.focusTrigger(value);
    },
    rootId: (): string => this.rootId,
    itemId: (value: string): string => this.itemId(value),
    triggerId: (value: string): string => this.triggerId(value),
    contentId: (value: string): string => this.contentId(value),
    subscribe: this.listeners.subscribe,
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
    ensureShadowStylesheet(this.host);
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
    this.listeners.notify();
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

  public render(): VNode {
    return (
      <Host class={styles.host}>
        <div
          id={this.rootId}
          data-scope="accordion"
          data-part="root"
          data-orientation={this.orientation}
          dir={this.textDirection}
          class={styles.root}
          part="root"
        >
          <slot />
        </div>
      </Host>
    );
  }
}

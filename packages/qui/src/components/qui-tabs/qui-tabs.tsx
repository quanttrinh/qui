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

import { dataAttr } from "../../helpers/attr";
import { nextId } from "../../helpers/id";
import { ensureShadowStylesheet } from "../../utilities/styles";
import { createListenerStore } from "../shared/listener-store";
import { ReactiveControlBase } from "../shared/reactive-control/component-base";
import { clearTabs, provideTabs, type TabsContext, type TabsVariant } from "./context";
import { TabsController } from "./controller";

const styles = {
  host: css({ display: "block" }),
  root: css({
    display: "flex",
    flexDirection: "column",
    width: "full",
    color: "onSurface",
    "&[data-orientation=vertical]": {
      flexDirection: "row",
      alignItems: "flex-start",
    },
  }),
};

/** Emitted whenever the selected tab changes. */
export interface TabsValueChangeDetails {
  value: string | undefined;
}

/**
 * MD3 tabs. Compose with `qui-tab-list`, `qui-tab-trigger`, and `qui-tab-panel`.
 *
 * @slot - Tab list and panels.
 */
@Component({
  tag: "qui-tabs",
  styleUrl: resolveVar(styleUrls.quiTabs),
  shadow: true,
})
export class QuiTabs extends ReactiveControlBase {
  @Element() host!: HTMLQuiTabsElement;

  /** The controlled selected tab value. */
  @Prop() value?: string;
  /** The initial selected tab value. */
  @Prop() defaultValue?: string;
  /** The tab layout. */
  @Prop() orientation: "horizontal" | "vertical" = "horizontal";
  /** Whether focus activates a tab or Enter/Space is required. */
  @Prop() activationMode: "manual" | "automatic" = "automatic";
  /** Whether keyboard navigation wraps. */
  @Prop() loopFocus?: boolean;
  /** Whether clicking the active tab clears the selection. */
  @Prop() deselectable = false;
  /** Text direction. */
  @Prop() textDirection?: "ltr" | "rtl";
  /** The MD3 tab style. */
  @Prop() variant: TabsVariant = "primary";

  /** Emitted whenever the selected tab changes. */
  @Event({ eventName: "valuechange", bubbles: true, composed: true })
  valueChange!: EventEmitter<TabsValueChangeDetails>;

  private readonly listeners = createListenerStore();
  private readonly generatedId = nextId("qui-tabs");
  private idBase = "";
  private readonly controller = new TabsController({
    getValue: (): string | undefined => this.value,
    getDefaultValue: (): string | undefined => this.defaultValue,
    getActivationMode: (): "manual" | "automatic" => this.activationMode,
    getLoopFocus: (): boolean => this.loopFocus ?? true,
    getDeselectable: (): boolean => this.deselectable,
    onChange: (value: string | undefined): void => {
      this.valueChange.emit({ value });
    },
    requestUpdate: (): void => {
      forceUpdate(this.host);
      this.listeners.notify();
    },
  });
  private readonly context: TabsContext = {
    value: (): string | undefined => this.controller.value,
    focusedValue: (): string | undefined => this.controller.focusedValue,
    hasFocus: (): boolean => this.controller.hasFocus,
    isSelected: (value: string): boolean => this.controller.value === value,
    isFocused: (value: string): boolean => this.controller.focusedValue === value,
    select: (value: string): void => {
      this.controller.select(value);
    },
    focus: (value: string): void => {
      this.controller.focus(value);
    },
    blur: (): void => {
      this.controller.blur();
    },
    move: (delta: 1 | -1): void => {
      this.controller.move(delta);
    },
    edge: (edge: "first" | "last"): void => {
      this.controller.edge(edge);
    },
    registerList: (host: HTMLElement) => this.controller.registerList(host),
    registerTrigger: (value: string, triggerHost: HTMLElement, trigger: HTMLButtonElement) =>
      this.controller.registerTrigger(value, triggerHost, trigger),
    registerPanel: (value: string, panelHost: HTMLElement) =>
      this.controller.registerPanel(value, panelHost),
    getList: (): HTMLElement | undefined => this.controller.getList(),
    getTrigger: (value: string) => this.controller.getTrigger(value),
    getPanel: (value: string): HTMLElement | undefined => this.controller.getPanel(value),
    focusTrigger: (value: string): void => {
      this.controller.focusTrigger(value);
    },
    variant: (): TabsVariant => this.variant,
    orientation: (): "horizontal" | "vertical" => this.orientation,
    textDirection: (): "ltr" | "rtl" => this.textDirection ?? "ltr",
    rootId: (): string => this.rootId,
    listId: (): string => this.listId,
    triggerId: (value: string): string => this.triggerId(value),
    panelId: (value: string): string => this.panelId(value),
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
    provideTabs(this.host, this.context);
    ensureShadowStylesheet(this.host);
  }

  public componentWillLoad(): void {
    super.componentWillLoad();
    this.idBase = this.host.id || this.generatedId;
    provideTabs(this.host, this.context);
  }

  public disconnectedCallback(): void {
    super.disconnectedCallback();
    clearTabs(this.host);
    this.listeners.clear();
  }

  @Watch("value")
  @Watch("orientation")
  @Watch("activationMode")
  @Watch("loopFocus")
  @Watch("deselectable")
  @Watch("textDirection")
  @Watch("variant")
  private syncContext(): void {
    forceUpdate(this.host);
    this.listeners.notify();
  }

  private get rootId(): string {
    return `tabs:${this.idBase || this.generatedId}`;
  }

  private get listId(): string {
    return `${this.rootId}:list`;
  }

  private triggerId(value: string): string {
    return `${this.rootId}:trigger-${value}`;
  }

  private panelId(value: string): string {
    return `${this.rootId}:content-${value}`;
  }

  public render(): VNode {
    return (
      <Host class={styles.host}>
        <div
          id={this.rootId}
          data-scope="tabs"
          data-part="root"
          data-orientation={this.orientation}
          data-focus={dataAttr(this.controller.hasFocus)}
          data-variant={this.variant}
          dir={this.textDirection ?? "ltr"}
          class={styles.root}
          part="root"
        >
          <slot />
        </div>
      </Host>
    );
  }
}

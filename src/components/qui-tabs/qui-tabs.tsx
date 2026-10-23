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
import {
  connect as tabsConnect,
  machine as tabsMachine,
  type Api as TabsApi,
  type Props as TabsProps,
  type ValueChangeDetails,
} from "@zag-js/tabs";
import { normalizeProps, spreadProps, VanillaMachine } from "@zag-js/vanilla";

import { styleUrls } from "#qui-style-url";
import { css, cx } from "#styled-system/css";

import { getRootNode } from "../../utilities/dom";
import { nextId } from "../../utilities/id";
import { type MachineSchemaOf } from "../../utilities/zag";
import { clearTabs, provideTabs, type TabsContext, type TabsVariant } from "./tabs-context";

type TabsSchema = MachineSchemaOf<typeof tabsMachine>;

const styles = {
  host: css({ display: "block", width: "full" }),
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

/**
 * MD3 tabs. Compose with `qui-tab-list`, `qui-tab-trigger`, and `qui-tab-panel`.
 *
 * @slot - Tab list and panels.
 */
@Component({
  tag: "qui-tabs",
  styleUrl: resolveVar(styleUrls.quiTabs),
  scoped: true,
})
export class QuiTabs {
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
  /** Additional class applied to the root element. */
  @Prop() innerClass?: string;

  /** Emitted whenever the selected tab changes. */
  @Event({ eventName: "valuechange", bubbles: true, composed: true })
  valueChange!: EventEmitter<ValueChangeDetails>;

  private machine?: VanillaMachine<TabsSchema>;
  private unsubscribe?: () => void;
  private readonly listeners = new Set<() => void>();
  private spreads: (() => void)[] = [];
  private rootEl?: HTMLDivElement;
  private readonly generatedId = nextId("qui-tabs");

  public componentWillLoad(): void {
    this.machine = new VanillaMachine(tabsMachine, () => this.machineProps());
    this.unsubscribe = this.machine.subscribe(() => {
      forceUpdate(this.host);
      this.notifyListeners();
    });
    this.machine.start();
    provideTabs(this.host, this.context());
  }

  public connectedCallback(): void {
    if (this.machine !== undefined) {
      provideTabs(this.host, this.context());
    }
  }

  public componentDidRender(): void {
    this.applySpreads();
  }

  public disconnectedCallback(): void {
    clearTabs(this.host);
    for (const cleanup of this.spreads) {
      cleanup();
    }
    this.spreads = [];
    this.unsubscribe?.();
    this.machine?.stop();
    this.listeners.clear();
  }

  @Watch("value")
  @Watch("orientation")
  @Watch("activationMode")
  @Watch("loopFocus")
  @Watch("deselectable")
  @Watch("textDirection")
  private syncMachineProps(): void {
    this.machine?.updateProps(this.machineProps());
  }

  private machineProps(): TabsProps {
    return {
      id: this.host.id || this.generatedId,
      getRootNode: () => getRootNode(this.host),
      value: this.value,
      defaultValue: this.defaultValue,
      orientation: this.orientation,
      activationMode: this.activationMode,
      loopFocus: this.loopFocus,
      deselectable: this.deselectable,
      dir: this.textDirection,
      onValueChange: (details) => {
        this.valueChange.emit(details);
      },
    };
  }

  private context(): TabsContext {
    return {
      api: () => this.api,
      variant: () => this.variant,
      orientation: () => this.orientation,
      subscribe: (listener) => {
        this.listeners.add(listener);
        return () => {
          this.listeners.delete(listener);
        };
      },
    };
  }

  private notifyListeners(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }

  private get api(): TabsApi {
    if (this.machine === undefined) {
      throw new Error("qui-tabs has not been initialized");
    }
    return tabsConnect(this.machine.service, normalizeProps);
  }

  private applySpreads(): void {
    if (this.rootEl === undefined) {
      return;
    }
    this.spreads = [
      spreadProps(this.rootEl, {
        ...this.api.getRootProps(),
        "data-variant": this.variant,
        class: cx(styles.root, this.innerClass),
      }),
    ];
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
          data-variant={this.variant}
        >
          <slot />
        </div>
      </Host>
    );
  }
}

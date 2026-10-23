import {
  resolveVar,
  Component,
  Element,
  forceUpdate,
  h,
  Host,
  Prop,
  type VNode,
} from "@stencil/core";
import { spreadProps } from "@zag-js/vanilla";

import { styleUrls } from "#qui-style-url";
import { css, cx } from "#styled-system/css";

import { consumeTabs, type TabsContext } from "./tabs-context";

const styles = {
  host: css({ display: "block" }),
  list: css({
    position: "relative",
    display: "flex",
    flexShrink: 0,
    borderBlockEndWidth: "1px",
    borderColor: "outlineVariant",
    "&[data-orientation=vertical]": {
      flexDirection: "column",
      borderBlockEndWidth: "0",
      borderInlineEndWidth: "1px",
    },
  }),
};

/**
 * The list container for `qui-tab-trigger` elements.
 *
 * @slot - Tab triggers.
 */
@Component({
  tag: "qui-tab-list",
  styleUrl: resolveVar(styleUrls.quiTabList),
  scoped: true,
})
export class QuiTabList {
  @Element() host!: HTMLQuiTabListElement;

  /** Additional class applied to the tab list. */
  @Prop() innerClass?: string;

  private tabs?: TabsContext;
  private unsubscribe?: () => void;
  private spreads: (() => void)[] = [];
  private listEl?: HTMLDivElement;

  public componentWillLoad(): void {
    this.attachTabs();
  }

  public componentDidLoad(): void {
    if (this.tabs === undefined) {
      this.attachTabs();
    }
  }

  public componentDidRender(): void {
    this.applySpreads();
  }

  public disconnectedCallback(): void {
    for (const cleanup of this.spreads) {
      cleanup();
    }
    this.spreads = [];
    this.unsubscribe?.();
  }

  private attachTabs(): void {
    const tabs = consumeTabs(this.host);
    if (tabs === undefined || tabs === this.tabs) {
      return;
    }
    this.unsubscribe?.();
    this.tabs = tabs;
    this.unsubscribe = tabs.subscribe(() => {
      forceUpdate(this.host);
    });
  }

  private applySpreads(): void {
    if (this.tabs === undefined || this.listEl === undefined) {
      return;
    }
    this.spreads = [
      spreadProps(this.listEl, {
        ...this.tabs.api().getListProps(),
        "data-variant": this.tabs.variant(),
        class: cx(styles.list, this.innerClass),
      }),
    ];
  }

  public render(): VNode {
    return (
      <Host class={styles.host}>
        <div
          ref={(el) => {
            if (el instanceof HTMLDivElement) {
              this.listEl = el;
            }
          }}
          class={styles.list}
          part="list"
          data-variant={this.tabs?.variant() ?? "primary"}
        >
          <slot />
        </div>
      </Host>
    );
  }
}

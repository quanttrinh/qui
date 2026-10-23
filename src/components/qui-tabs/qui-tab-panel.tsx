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
  host: css({ display: "block", flex: "1" }),
  panel: css({
    flex: "1",
    paddingY: "3",
    outlineStyle: "none",
    fontSize: "sm",
    color: "onSurfaceVariant",
    // Defers layout/paint of off-screen panels. Inactive panels are also hidden
    // By Zag, so this mainly helps long, active panels below the fold.
    contentVisibility: "auto",
    containIntrinsicSize: "auto 100px",
    "&[data-orientation=vertical]": { paddingY: "0", paddingInlineStart: "4" },
    "&:focus-visible": {
      outlineWidth: "2px",
      outlineStyle: "solid",
      outlineColor: "primary",
      outlineOffset: "2px",
    },
  }),
};

/**
 * A tab panel. Must be inside `qui-tabs`.
 *
 * @slot - Panel content.
 */
@Component({
  tag: "qui-tab-panel",
  styleUrl: resolveVar(styleUrls.quiTabPanel),
  scoped: true,
})
export class QuiTabPanel {
  @Element() host!: HTMLQuiTabPanelElement;

  /** The value linking this panel to its trigger. */
  @Prop() value!: string;
  /** Additional class applied to the panel. */
  @Prop() innerClass?: string;

  private tabs?: TabsContext;
  private unsubscribe?: () => void;
  private spreads: (() => void)[] = [];
  private panelEl?: HTMLDivElement;

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
    if (this.tabs === undefined || this.panelEl === undefined) {
      return;
    }
    this.spreads = [
      spreadProps(this.panelEl, {
        ...this.tabs.api().getContentProps({ value: this.value }),
        "data-orientation": this.tabs.orientation(),
        class: cx(styles.panel, this.innerClass),
      }),
    ];
  }

  public render(): VNode {
    return (
      <Host class={styles.host}>
        <div
          ref={(el) => {
            if (el instanceof HTMLDivElement) {
              this.panelEl = el;
            }
          }}
          class={styles.panel}
          part="panel"
          data-orientation={this.tabs?.orientation() ?? "horizontal"}
        >
          <slot />
        </div>
      </Host>
    );
  }
}

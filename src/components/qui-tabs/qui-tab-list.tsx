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

import { styleUrls } from "#qui-style-url";
import { css, cx } from "#styled-system/css";

import { dataAttr } from "../../helpers/attr";
import { isHTMLDivElement } from "../../helpers/dom";
import { consumeTabs, type TabsContext, type TabsOrientation } from "./context";

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

function arrowDelta(key: string, orientation: TabsOrientation, rtl: boolean): 1 | -1 | undefined {
  switch (key) {
    case "ArrowDown": {
      return orientation === "vertical" ? 1 : undefined;
    }
    case "ArrowUp": {
      return orientation === "vertical" ? -1 : undefined;
    }
    case "ArrowLeft": {
      if (orientation !== "horizontal") {
        return undefined;
      }
      return rtl ? 1 : -1;
    }
    case "ArrowRight": {
      if (orientation !== "horizontal") {
        return undefined;
      }
      return rtl ? -1 : 1;
    }
    default: {
      return undefined;
    }
  }
}

function edgeKey(key: string): "first" | "last" | undefined {
  if (key === "Home") {
    return "first";
  }
  if (key === "End") {
    return "last";
  }
  return undefined;
}

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
  private listEl?: HTMLDivElement;

  public componentWillLoad(): void {
    this.attachTabs();
  }

  public componentDidLoad(): void {
    if (this.tabs === undefined) {
      this.attachTabs();
      forceUpdate(this.host);
    }
  }

  public disconnectedCallback(): void {
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

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    const { tabs, listEl } = this;
    if (tabs === undefined || listEl === undefined || event.defaultPrevented || event.isComposing) {
      return;
    }
    const { target } = event;
    if (!(target instanceof Node) || !listEl.contains(target)) {
      return;
    }
    const orientation = tabs.orientation();
    const delta = arrowDelta(event.key, orientation, tabs.textDirection() === "rtl");
    if (delta !== undefined) {
      event.preventDefault();
      tabs.move(delta);
      return;
    }
    const edge = edgeKey(event.key);
    if (edge !== undefined) {
      event.preventDefault();
      tabs.edge(edge);
    }
  };

  public render(): VNode {
    const variant = this.tabs?.variant() ?? "primary";
    const orientation = this.tabs?.orientation() ?? "horizontal";
    const textDirection = this.tabs?.textDirection() ?? "ltr";
    const hasFocus = this.tabs?.hasFocus() ?? false;

    return (
      <Host class={styles.host}>
        <div
          ref={(el) => {
            if (isHTMLDivElement(el)) {
              this.listEl = el;
            }
          }}
          id={this.tabs?.listId()}
          role="tablist"
          aria-orientation={orientation}
          data-scope="tabs"
          data-part="list"
          data-orientation={orientation}
          data-focus={dataAttr(hasFocus)}
          data-variant={variant}
          dir={textDirection}
          class={cx(styles.list, this.innerClass)}
          part="list"
          onKeyDown={this.handleKeyDown}
        >
          <slot />
        </div>
      </Host>
    );
  }
}

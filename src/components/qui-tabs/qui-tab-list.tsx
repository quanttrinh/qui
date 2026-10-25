import { resolveVar, Component, Element, h, Host, Prop, type VNode } from "@stencil/core";

import { styleUrls } from "#qui-style-url";
import { css, cx } from "#styled-system/css";

import { dataAttr } from "../../helpers/attr";
import { isHTMLDivElement } from "../../helpers/dom";
import { consumeContextPart } from "../shared/context-part";
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

  private readonly part = consumeContextPart({
    host: (): HTMLElement => this.host,
    key: "tabs",
    consume: consumeTabs,
  });
  private listEl?: HTMLDivElement;

  private get tabs(): TabsContext | undefined {
    return this.part.context;
  }

  public connectedCallback(): void {
    this.part.hostConnected();
  }

  public componentWillLoad(): void {
    this.part.hostWillLoad();
  }

  public componentDidLoad(): void {
    this.part.hostDidLoad();
  }

  public disconnectedCallback(): void {
    this.part.hostDisconnected();
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

import { resolveVar, Component, Element, h, Host, Prop, type VNode } from "@stencil/core";

import { styleUrls } from "#qui-style-url";
import { css, cx } from "#styled-system/css";

import { dataAttr } from "../../helpers/attr";
import { ExpandMoreIcon } from "../qui-icon/icons";
import { consumeContextPart } from "../shared/context-part";
import { consumeAccordionItem, type AccordionItemContext } from "./accordion-context";

const styles = {
  host: css({ display: "block" }),
  heading: css({ margin: "0" }),
  trigger: css({
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    width: "full",
    paddingX: "4",
    paddingY: "3",
    borderWidth: "0",
    backgroundColor: "transparent",
    fontSize: "sm",
    fontWeight: "medium",
    color: "onSurface",
    textAlign: "start",
    cursor: "pointer",
    "&:hover": { backgroundColor: "surfaceContainerHigh" },
    "&:focus-visible": {
      outlineWidth: "2px",
      outlineStyle: "solid",
      outlineColor: "primary",
      outlineOffset: "-2px",
    },
    "&:disabled": { cursor: "not-allowed" },
  }),
  indicator: css({
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    width: "6",
    height: "6",
    color: "onSurfaceVariant",
    fontSize: "md",
    transition: "transform 200ms ease",
    "&[data-state=open]": { transform: "rotate(180deg)" },
    "& svg": { width: "1em", height: "1em" },
  }),
};

function arrowDelta(
  key: string,
  orientation: "horizontal" | "vertical",
  rtl: boolean,
): 1 | -1 | undefined {
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
 * The trigger for a `qui-accordion-item`.
 *
 * @slot - Trigger label.
 */
@Component({
  tag: "qui-accordion-trigger",
  styleUrl: resolveVar(styleUrls.quiAccordionTrigger),
  scoped: true,
})
export class QuiAccordionTrigger {
  @Element() host!: HTMLQuiAccordionTriggerElement;

  /** Additional class applied to the trigger button. */
  @Prop() innerClass?: string;

  private readonly part = consumeContextPart({
    host: (): HTMLElement => this.host,
    consume: consumeAccordionItem,
  });

  private get item(): AccordionItemContext | undefined {
    return this.part.context;
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

  private disabled(): boolean {
    return this.item?.isItemDisabled() ?? false;
  }

  private readonly handleClick = (): void => {
    if (!this.disabled()) {
      this.item?.toggle(this.item.item().value);
    }
  };

  private readonly handleFocus = (): void => {
    if (!this.disabled()) {
      this.item?.focus(this.item.item().value);
    }
  };

  private readonly handleBlur = (): void => {
    if (!this.disabled()) {
      this.item?.blur();
    }
  };

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    const { item } = this;
    if (item === undefined || this.disabled() || event.defaultPrevented) {
      return;
    }
    const orientation = item.orientation();
    const rtl = item.textDirection() === "rtl" && orientation === "horizontal";
    const { value } = item.item();
    const delta = arrowDelta(event.key, orientation, rtl);
    if (delta !== undefined) {
      event.preventDefault();
      item.move(value, delta);
      return;
    }
    const edge = edgeKey(event.key);
    if (edge !== undefined) {
      event.preventDefault();
      item.edge(edge);
    }
  };

  public render(): VNode {
    const { item } = this;
    const value = item?.item().value ?? "";
    const expanded = item?.isExpanded(value) ?? false;
    const focused = item?.isFocused(value) ?? false;
    const disabled = this.disabled();
    const orientation = item?.orientation() ?? "vertical";

    return (
      <Host class={styles.host}>
        <h3 class={styles.heading}>
          <button
            id={item?.triggerId(value)}
            type="button"
            aria-controls={item?.contentId(value)}
            data-controls={item?.contentId(value)}
            aria-expanded={expanded ? "true" : "false"}
            disabled={disabled}
            data-scope="accordion"
            data-part="item-trigger"
            data-state={expanded ? "open" : "closed"}
            data-focus={dataAttr(focused)}
            data-ownedby={item?.rootId()}
            data-orientation={orientation}
            dir={item?.textDirection()}
            class={cx(styles.trigger, this.innerClass)}
            part="trigger"
            onClick={this.handleClick}
            onFocus={this.handleFocus}
            onBlur={this.handleBlur}
            onKeyDown={this.handleKeyDown}
          >
            <slot />
            <span
              aria-hidden="true"
              data-scope="accordion"
              data-part="item-indicator"
              data-state={expanded ? "open" : "closed"}
              data-disabled={dataAttr(disabled)}
              data-focus={dataAttr(focused)}
              data-orientation={orientation}
              dir={item?.textDirection()}
              class={styles.indicator}
              part="indicator"
            >
              <ExpandMoreIcon />
            </span>
          </button>
        </h3>
      </Host>
    );
  }
}

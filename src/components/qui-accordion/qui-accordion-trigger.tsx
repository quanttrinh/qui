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

import { ExpandMoreIcon } from "../qui-icon/icons";
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

  private item?: AccordionItemContext;
  private unsubscribe?: () => void;
  private spreads: (() => void)[] = [];
  private buttonEl?: HTMLButtonElement;
  private indicatorEl?: HTMLSpanElement;

  public componentWillLoad(): void {
    this.attachItem();
  }

  public componentDidLoad(): void {
    if (this.item === undefined) {
      this.attachItem();
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

  private attachItem(): void {
    const item = consumeAccordionItem(this.host);
    if (item === undefined || item === this.item) {
      return;
    }
    this.unsubscribe?.();
    this.item = item;
    this.unsubscribe = item.subscribe(() => {
      forceUpdate(this.host);
    });
  }

  private applySpreads(): void {
    if (this.item === undefined) {
      return;
    }
    this.spreads = [];
    const api = this.item.api();
    const item = this.item.item();
    if (this.buttonEl !== undefined) {
      const triggerProps = api.getItemTriggerProps(item);
      this.spreads.push(
        spreadProps(this.buttonEl, {
          ...triggerProps,
          class: cx(styles.trigger, this.innerClass),
        }),
      );
    }
    if (this.indicatorEl !== undefined) {
      const indicatorProps = api.getItemIndicatorProps(item);
      this.spreads.push(
        spreadProps(this.indicatorEl, {
          ...indicatorProps,
          class: styles.indicator,
        }),
      );
    }
  }

  public render(): VNode {
    return (
      <Host class={styles.host}>
        <h3 class={styles.heading}>
          <button
            ref={(el) => {
              if (el instanceof HTMLButtonElement) {
                this.buttonEl = el;
              }
            }}
            class={styles.trigger}
            part="trigger"
          >
            <slot />
            <span
              ref={(el) => {
                if (el instanceof HTMLSpanElement) {
                  this.indicatorEl = el;
                }
              }}
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

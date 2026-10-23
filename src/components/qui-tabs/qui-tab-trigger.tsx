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

import { consumeTabs, type TabsContext, type TabsVariant } from "./tabs-context";

const styles = {
  host: css({ display: "flex", flex: "1" }),
  trigger: css({
    position: "relative",
    isolation: "isolate",
    display: "flex",
    flex: "1",
    alignItems: "center",
    justifyContent: "center",
    paddingInline: "4",
    color: "onSurfaceVariant",
    fontSize: "sm",
    fontWeight: "medium",
    whiteSpace: "nowrap",
    cursor: "pointer",
    borderWidth: "0",
    backgroundColor: "transparent",
    transition: "color 150ms",
    "& svg": { width: "24px", height: "24px" },
    "&::before": {
      content: '""',
      position: "absolute",
      inset: "0",
      zIndex: "-1",
      backgroundColor: "currentColor",
      opacity: 0,
      pointerEvents: "none",
      transition: "opacity 150ms",
    },
    "&:hover:not(:disabled)::before": { opacity: 0.08 },
    "&:focus-visible::before": { opacity: 0.1 },
    "&:active:not(:disabled)::before": { opacity: 0.1 },
    "&:hover:not([data-selected])": { color: "onSurface" },
    "&[data-selected]": { color: "primary" },
    "&[data-variant=secondary][data-selected]": { color: "onSurface" },
    "&:focus-visible": {
      outlineWidth: "2px",
      outlineStyle: "solid",
      outlineColor: "primary",
      outlineOffset: "-2px",
    },
    "&:disabled": { cursor: "not-allowed", opacity: 0.38 },
    "&[data-orientation=vertical]": {
      flex: "none",
      justifyContent: "flex-start",
      width: "full",
    },
  }),
  tabContent: css({
    position: "relative",
    display: "inline-flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "1",
    minHeight: "12",
    paddingBlock: "2",
    "&[data-variant=secondary]": { flexDirection: "row", gap: "2" },
    "&[data-orientation=vertical]": { width: "full", justifyContent: "flex-start" },
  }),
  indicator: css({
    position: "absolute",
    backgroundColor: "primary",
    opacity: 0,
    transform: "scaleX(0.5)",
    transition: "opacity 150ms, transform 200ms cubic-bezier(0.2, 0, 0, 1)",
    "[data-selected] &": { opacity: 1, transform: "scaleX(1)" },
    insetBlockEnd: "0",
    insetInline: "0",
    marginInline: "0.5",
    height: "3px",
    borderTopLeftRadius: "3px",
    borderTopRightRadius: "3px",
    "&[data-variant=secondary]": {
      marginInline: "0",
      height: "0.5",
      borderTopLeftRadius: "0",
      borderTopRightRadius: "0",
    },
    "&[data-orientation=vertical]": {
      inset: "0 auto 0 0",
      marginBlock: "0.5",
      marginInline: "0",
      width: "3px",
      height: "auto",
      borderRadius: "3px 0 0 3px",
    },
    "&[data-orientation=vertical][data-variant=secondary]": {
      marginBlock: "0",
      width: "0.5",
      borderRadius: "0",
    },
  }),
};

function renderIndicator(variant: TabsVariant, orientation: "horizontal" | "vertical"): VNode {
  return (
    <span
      class={styles.indicator}
      data-variant={variant}
      data-orientation={orientation}
      part="indicator"
    />
  );
}

/**
 * A single tab trigger. Must be inside `qui-tab-list`.
 *
 * @slot - Tab label or icon.
 */
@Component({
  tag: "qui-tab-trigger",
  styleUrl: resolveVar(styleUrls.quiTabTrigger),
  scoped: true,
})
export class QuiTabTrigger {
  @Element() host!: HTMLQuiTabTriggerElement;

  /** The value linking this trigger to its panel. */
  @Prop() value!: string;
  /** Disables the tab. */
  @Prop() disabled = false;
  /** Additional class applied to the trigger button. */
  @Prop() innerClass?: string;

  private tabs?: TabsContext;
  private unsubscribe?: () => void;
  private spreads: (() => void)[] = [];
  private buttonEl?: HTMLButtonElement;

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
    if (this.tabs === undefined || this.buttonEl === undefined) {
      return;
    }
    this.spreads = [
      spreadProps(this.buttonEl, {
        ...this.tabs.api().getTriggerProps({ value: this.value, disabled: this.disabled }),
        "data-variant": this.tabs.variant(),
        class: cx(styles.trigger, this.innerClass),
      }),
    ];
  }

  public render(): VNode {
    const variant = this.tabs?.variant() ?? "primary";
    const orientation = this.tabs?.orientation() ?? "horizontal";

    return (
      <Host class={styles.host}>
        <button
          ref={(el) => {
            if (el instanceof HTMLButtonElement) {
              this.buttonEl = el;
            }
          }}
          class={styles.trigger}
          part="trigger"
          data-variant={variant}
          data-orientation={orientation}
        >
          <span class={styles.tabContent} data-variant={variant} data-orientation={orientation}>
            <slot />
            {variant === "primary" ? renderIndicator(variant, orientation) : undefined}
          </span>
          {variant === "secondary" ? renderIndicator(variant, orientation) : undefined}
        </button>
      </Host>
    );
  }
}

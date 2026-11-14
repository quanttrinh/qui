import {
  Mixin,
  resolveVar,
  Component,
  Element,
  h,
  Host,
  Prop,
  Watch,
  type VNode,
} from "@stencil/core";

import { styleUrls } from "#qui-style-url";
import { css } from "#styled-system/css";
import { token } from "#styled-system/tokens";

import { ContextPartController, RegistrationReconciler } from "../shared/controllers";
import { setAriaControls } from "../shared/helpers/aria/aria";
import { dataAttr } from "../shared/helpers/aria/attr";
import { shallowEqual } from "../shared/helpers/collection";
import { isHTMLElement } from "../shared/helpers/dom/dom";
import { ControllerHostMixin, ShadowStylesMixin } from "../shared/mixins";
import { focusRingInset } from "../shared/styles";
import { tabsContext, type TabsContext, type TabsVariant } from "./context";

const styles = {
  host: css({ display: "contents" }),
  trigger: css({
    pos: "relative",
    isolation: "isolate",
    display: "flex",
    flex: "1",
    alignItems: "center",
    justifyContent: "center",
    px: "4",
    color: `var(--qui-tabs-label-color, ${token("colors.onSurfaceVariant")})`,
    textStyle: "sm",
    fontWeight: "medium",
    whiteSpace: "nowrap",
    cursor: "pointer",
    borderWidth: "0",
    bgColor: "transparent",
    transition: "color 150ms",
    "&::before": {
      content: '""',
      pos: "absolute",
      inset: "0",
      zIndex: "-1",
      bgColor: "currentColor",
      opacity: 0,
      pointerEvents: "none",
      transition: "opacity 150ms",
    },
    "&:hover:not(:disabled)::before": { opacity: 0.08 },
    "&:focus-visible::before": { opacity: 0.1 },
    "&:active:not(:disabled)::before": { opacity: 0.1 },
    "&:hover:not([data-selected])": {
      color: `var(--qui-tabs-label-hover-color, ${token("colors.onSurface")})`,
    },
    "&[data-selected]": {
      color: `var(--qui-tabs-label-selected-color, ${token("colors.primary")})`,
    },
    "&[data-variant=secondary][data-selected]": {
      color: `var(--qui-tabs-label-selected-color, ${token("colors.onSurface")})`,
    },
    "&:focus-visible": {
      ...focusRingInset,
      ringColor: `var(--qui-tabs-focus-ring-color, ${token("colors.primary")})`,
    },
    "&:disabled": { cursor: "not-allowed", opacity: 0.38 },
    "&[data-orientation=vertical]": {
      flex: "none",
      justifyContent: "flex-start",
      w: "full",
    },
  }),
  tabContent: css({
    pos: "relative",
    display: "inline-flex",
    flexDir: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "1",
    minH: "12",
    py: "2",
    "&[data-variant=secondary]": { flexDir: "row", gap: "2" },
    "&[data-orientation=vertical]": { w: "full", justifyContent: "flex-start" },
  }),
  indicator: css({
    pos: "absolute",
    bgColor: `var(--qui-tabs-indicator-color, ${token("colors.primary")})`,
    opacity: 0,
    transform: "scaleX(0.5)",
    transition: "opacity 150ms, transform 200ms cubic-bezier(0.2, 0, 0, 1)",
    "&[data-selected]": { opacity: 1, transform: "scaleX(1)" },
    insetBlockEnd: "0",
    insetX: "0.5",
    h: "3px",
    roundedStartStart: "3px",
    roundedStartEnd: "3px",
    "&[data-variant=secondary]": {
      insetX: "0",
      h: "0.5",
      roundedStartStart: "0",
      roundedStartEnd: "0",
    },
    "&[data-orientation=vertical]": {
      insetY: "0.5",
      start: "0",
      end: "auto",
      w: "3px",
      h: "auto",
      rounded: "3px 0 0 3px",
    },
    "&[data-orientation=vertical][data-variant=secondary]": {
      insetY: "0",
      w: "0.5",
      rounded: "0",
    },
  }),
};

function renderIndicator(
  variant: TabsVariant,
  orientation: "horizontal" | "vertical",
  selected: boolean,
): VNode {
  return (
    <span
      class={styles.indicator}
      data-variant={variant}
      data-orientation={orientation}
      data-selected={dataAttr(selected)}
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
  shadow: true,
})
export class QuiTabTrigger extends Mixin(ShadowStylesMixin, ControllerHostMixin) {
  @Element() host!: HTMLQuiTabTriggerElement;

  /** The value linking this trigger to its panel. */
  @Prop() value!: string;
  /** Disables the tab. */
  @Prop() disabled = false;

  private triggerEl?: HTMLButtonElement;
  private ariaTriggerEl?: HTMLButtonElement;
  private ariaPanel?: HTMLElement;
  private readonly registration = new RegistrationReconciler();

  protected readonly contextPart = new ContextPartController(this, {
    context: tabsContext,
    select: (tabs) => [
      tabs.isSelected(this.value),
      tabs.isFocused(this.value),
      tabs.variant(),
      tabs.orientation(),
      tabs.textDirection(),
    ],
    equals: shallowEqual,
  });

  private get tabs(): TabsContext | undefined {
    return this.contextPart.context;
  }

  componentDidRender(): void {
    this.syncRegistration();
    this.syncAria();
  }

  @Watch("disabled")
  private invalidateTriggers(): void {
    // The enabled-trigger cache only depends on this trigger's disabled state.
    this.tabs?.invalidateTriggers();
  }

  disconnectedCallback(): void {
    this.registration.clear();
    super.disconnectedCallback();
  }

  private syncRegistration(): void {
    const { tabs, triggerEl } = this;
    if (!tabs || !triggerEl) {
      return;
    }
    this.registration.reconcile([tabs, this.value, triggerEl], () =>
      tabs.registerTrigger(this.value, this.host, triggerEl),
    );
  }

  private syncAria(): void {
    const { tabs, triggerEl } = this;
    if (!tabs || !triggerEl) {
      return;
    }
    const panel = tabs.getPanel(this.value);
    if (this.ariaTriggerEl === triggerEl && this.ariaPanel === panel) {
      return;
    }
    this.ariaTriggerEl = triggerEl;
    this.ariaPanel = panel;
    setAriaControls(triggerEl, panel === undefined ? [] : [panel]);
  }

  private readonly handleClick = (): void => {
    if (this.disabled) {
      return;
    }
    this.tabs?.select(this.value);
  };

  private readonly handleFocus = (): void => {
    this.tabs?.focus(this.value);
  };

  private readonly handleBlur = (event: FocusEvent): void => {
    const next = event.relatedTarget;
    if (isHTMLElement(next) && next.tagName === "QUI-TAB-TRIGGER") {
      return;
    }
    this.tabs?.blur();
  };

  render(): VNode {
    const variant = this.tabs?.variant() ?? "primary";
    const orientation = this.tabs?.orientation() ?? "horizontal";
    const textDirection = this.tabs?.textDirection() ?? "ltr";
    const selected = this.tabs?.isSelected(this.value) ?? false;
    const focused = this.tabs?.isFocused(this.value) ?? false;

    return (
      <Host id={this.tabs?.triggerId(this.value)} class={styles.host}>
        <button
          ref={(el) => {
            this.triggerEl = el;
          }}
          type="button"
          role="tab"
          disabled={this.disabled}
          aria-disabled={this.disabled ? "true" : "false"}
          aria-selected={selected ? "true" : "false"}
          aria-controls={selected ? this.tabs?.panelId(this.value) : undefined}
          tabIndex={selected ? 0 : -1}
          data-scope="tabs"
          data-part="trigger"
          data-value={this.value}
          data-orientation={orientation}
          data-disabled={dataAttr(this.disabled)}
          data-selected={dataAttr(selected)}
          data-focus={dataAttr(focused)}
          data-ownedby={this.tabs?.listId()}
          data-variant={variant}
          dir={textDirection}
          class={styles.trigger}
          part="trigger"
          onClick={this.handleClick}
          onFocus={this.handleFocus}
          onBlur={this.handleBlur}
        >
          <span class={styles.tabContent} data-variant={variant} data-orientation={orientation}>
            <slot />
            {variant === "primary" ? renderIndicator(variant, orientation, selected) : undefined}
          </span>
          {variant === "secondary" ? renderIndicator(variant, orientation, selected) : undefined}
        </button>
      </Host>
    );
  }
}

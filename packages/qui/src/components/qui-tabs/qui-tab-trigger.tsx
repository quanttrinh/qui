import { resolveVar, Component, Element, h, Host, Prop, type VNode } from "@stencil/core";

import { styleUrls } from "#qui-style-url";
import { css } from "#styled-system/css";

import { dataAttr } from "../../helpers/attr";
import { isHTMLElement } from "../../helpers/dom";
import { setAriaControls } from "../shared/aria";
import { consumeContextPart } from "../shared/context-part";
import { ContextPartElement } from "../shared/context-part-element";
import { RegistrationReconciler } from "../shared/registration-reconciler";
import { focusRingInset } from "../shared/styles";
import { consumeTabs, type TabsContext, type TabsVariant } from "./context";

const styles = {
  host: css({ display: "contents" }),
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
    "&:focus-visible": focusRingInset,
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
  shadow: true,
})
export class QuiTabTrigger extends ContextPartElement<TabsContext> {
  @Element() host!: HTMLQuiTabTriggerElement;

  /** The value linking this trigger to its panel. */
  @Prop() value!: string;
  /** Disables the tab. */
  @Prop() disabled = false;

  private triggerEl?: HTMLButtonElement;
  private readonly registration = new RegistrationReconciler();

  protected readonly contextPart = consumeContextPart({
    host: (): HTMLElement => this.host,
    key: "tabs",
    consume: consumeTabs,
  });

  private get tabs(): TabsContext | undefined {
    return this.contextPart.context;
  }

  public componentDidRender(): void {
    this.syncRegistration();
    this.syncAria();
  }

  public disconnectedCallback(): void {
    this.registration.clear();
    super.disconnectedCallback();
  }

  private syncRegistration(): void {
    const { tabs, triggerEl } = this;
    if (tabs === undefined || triggerEl === undefined) {
      return;
    }
    this.registration.reconcile([tabs, this.value, triggerEl], () =>
      tabs.registerTrigger(this.value, this.host, triggerEl),
    );
  }

  private syncAria(): void {
    const { tabs, triggerEl } = this;
    if (tabs === undefined || triggerEl === undefined) {
      return;
    }
    const panel = tabs.getPanel(this.value);
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

  public render(): VNode {
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
            {variant === "primary" ? renderIndicator(variant, orientation) : undefined}
          </span>
          {variant === "secondary" ? renderIndicator(variant, orientation) : undefined}
        </button>
      </Host>
    );
  }
}

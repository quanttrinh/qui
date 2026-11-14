import { Mixin, resolveVar, Component, Element, h, Host, type VNode } from "@stencil/core";

import { styleUrls } from "#qui-style-url";
import { css } from "#styled-system/css";
import { token } from "#styled-system/tokens";

import { ExpandMoreIcon } from "../qui-icon/icons";
import { ContextPartController, RegistrationReconciler } from "../shared/controllers";
import { setAriaControls } from "../shared/helpers/aria/aria";
import { dataAttr } from "../shared/helpers/aria/attr";
import { isHTMLElement } from "../shared/helpers/dom/dom";
import { arrowDelta, edgeKey } from "../shared/helpers/dom/keyboard";
import { ControllerHostMixin, ShadowStylesMixin } from "../shared/mixins";
import { focusRingInset } from "../shared/styles";
import { consumeAccordionItem, type AccordionItemContext } from "./accordion-context";

const styles = {
  host: css({ display: "block" }),
  heading: css({ m: "0" }), // oxlint-disable-line @pandacss/no-margin-properties -- Resets the default heading margin.
  trigger: css({
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    w: "full",
    px: "4",
    py: "3",
    borderWidth: "0",
    bgColor: "transparent",
    textStyle: "sm",
    fontWeight: "medium",
    color: `var(--qui-accordion-trigger-color, ${token("colors.onSurface")})`,
    textAlign: "start",
    cursor: "pointer",
    "&:hover": {
      bgColor: `var(--qui-accordion-trigger-hover-color, ${token("colors.surfaceContainerHigh")})`,
    },
    "&:focus-visible": {
      ...focusRingInset,
      ringColor: `var(--qui-accordion-focus-ring-color, ${token("colors.primary")})`,
    },
    "&:disabled": { cursor: "not-allowed" },
  }),
  indicator: css({
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    w: "6",
    h: "6",
    color: `var(--qui-accordion-indicator-color, ${token("colors.onSurfaceVariant")})`,
    fontSize: "md",
    transition: "transform 200ms ease",
    "&[data-state=open]": { transform: "rotate(180deg)" },
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
  shadow: true,
})
export class QuiAccordionTrigger extends Mixin(ShadowStylesMixin, ControllerHostMixin) {
  @Element() host!: HTMLQuiAccordionTriggerElement;

  private triggerEl?: HTMLButtonElement;
  private readonly registration = new RegistrationReconciler();
  private lastDisabled?: boolean;
  private ariaTriggerEl?: HTMLButtonElement;
  private ariaContent?: HTMLElement;

  protected readonly contextPart = new ContextPartController(this, {
    key: "accordion-item",
    consume: consumeAccordionItem,
    getKey: () => this.item?.item().value,
  });

  private get item(): AccordionItemContext | undefined {
    return this.contextPart.context;
  }

  componentDidRender(): void {
    this.syncRegistration();
    this.syncAria();
    // Only invalidate the enabled cache when the computed disabled state flips.
    const disabled = this.disabled();
    if (disabled !== this.lastDisabled) {
      this.lastDisabled = disabled;
      this.item?.invalidateTriggers();
    }
  }

  disconnectedCallback(): void {
    this.registration.clear();
    super.disconnectedCallback();
  }

  private syncRegistration(): void {
    const { item, triggerEl } = this;
    if (!item || !triggerEl) {
      return;
    }
    const { value } = item.item();
    this.registration.reconcile([item, value, triggerEl], () =>
      item.registerTrigger(value, this.host, triggerEl),
    );
  }

  private syncAria(): void {
    const { item, triggerEl } = this;
    if (!item || !triggerEl) {
      return;
    }
    const content = item.getContent(item.item().value);
    if (this.ariaTriggerEl === triggerEl && this.ariaContent === content) {
      return;
    }
    this.ariaTriggerEl = triggerEl;
    this.ariaContent = content;
    setAriaControls(triggerEl, content === undefined ? [] : [content]);
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

  private readonly handleBlur = (event: FocusEvent): void => {
    const next = event.relatedTarget;
    if (isHTMLElement(next) && next.tagName === "QUI-ACCORDION-TRIGGER") {
      return;
    }
    if (!this.disabled()) {
      this.item?.blur();
    }
  };

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    const { item } = this;
    if (!item || this.disabled() || event.defaultPrevented) {
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

  render(): VNode {
    const { item } = this;
    const value = item?.item().value ?? "";
    const expanded = item?.isExpanded(value) ?? false;
    const focused = item?.isFocused(value) ?? false;
    const disabled = this.disabled();
    const orientation = item?.orientation() ?? "vertical";

    return (
      <Host id={item?.triggerId(value)} class={styles.host}>
        <h3 class={styles.heading}>
          <button
            ref={(el) => {
              this.triggerEl = el;
            }}
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
            class={styles.trigger}
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

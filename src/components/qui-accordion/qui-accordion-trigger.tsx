import { resolveVar, Component, Element, h, Host, type VNode } from "@stencil/core";

import { styleUrls } from "#qui-style-url";
import { css } from "#styled-system/css";

import { dataAttr } from "../../helpers/attr";
import { isHTMLElement } from "../../helpers/dom";
import { ExpandMoreIcon } from "../qui-icon/icons";
import { setAriaControls } from "../shared/aria";
import { consumeContextPart } from "../shared/context-part";
import { ContextPartElement } from "../shared/context-part-element";
import { arrowDelta, edgeKey } from "../shared/keyboard";
import { RegistrationReconciler } from "../shared/registration-reconciler";
import { focusRingInset } from "../shared/styles";
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
    "&:focus-visible": focusRingInset,
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
  shadow: true,
})
export class QuiAccordionTrigger extends ContextPartElement<AccordionItemContext> {
  @Element() host!: HTMLQuiAccordionTriggerElement;

  private triggerEl?: HTMLButtonElement;
  private readonly registration = new RegistrationReconciler();

  protected readonly contextPart = consumeContextPart({
    host: (): HTMLElement => this.host,
    key: "accordion-item",
    consume: consumeAccordionItem,
  });

  private get item(): AccordionItemContext | undefined {
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
    const { item, triggerEl } = this;
    if (item === undefined || triggerEl === undefined) {
      return;
    }
    const { value } = item.item();
    this.registration.reconcile([item, value, triggerEl], () =>
      item.registerTrigger(value, this.host, triggerEl),
    );
  }

  private syncAria(): void {
    const { item, triggerEl } = this;
    if (item === undefined || triggerEl === undefined) {
      return;
    }
    const content = item.getContent(item.item().value);
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

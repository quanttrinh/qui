import { Mixin, resolveVar, Component, Element, h, Host, type VNode } from "@stencil/core";

import { styleUrls } from "#qui-style-url";
import { css } from "#styled-system/css";
import { token } from "#styled-system/tokens";

import { ContextPartController, RegistrationReconciler } from "../shared/controllers";
import { setAriaControls, setAriaLabelledBy } from "../shared/helpers/aria/aria";
import { dataAttr } from "../shared/helpers/aria/attr";
import { ControllerHostMixin, ShadowStylesMixin } from "../shared/mixins";
import { accordionItemContext, type AccordionItemContext } from "./accordion-context";
import { type AccordionTriggerRegistration } from "./controller";

const styles = {
  host: css({ display: "block" }),
  content: css({
    display: "grid",
    gridTemplateRows: "0fr",
    opacity: 0,
    color: `var(--qui-accordion-content-text-color, ${token("colors.onSurfaceVariant")})`,
    transition: "grid-template-rows 200ms ease, opacity 200ms ease",
    "&[data-state=open]": {
      gridTemplateRows: "1fr",
      opacity: 1,
    },
  }),
  body: css({
    overflow: "hidden",
    minH: "0",
    // Skips layout/paint for collapsed or off-screen bodies. The intrinsic size
    // Reuses the last rendered height to keep the placeholder stable.
    contentVisibility: "auto",
    containIntrinsicSize: "auto 100px",
  }),
  padding: css({
    px: "4",
    py: "3",
    fontSize: "sm",
  }),
};

/**
 * The collapsible content for a `qui-accordion-item`.
 *
 * @slot - Accordion body content.
 * @undefinedContent
 */
@Component({
  tag: "qui-accordion-content",
  styleUrl: resolveVar(styleUrls.quiAccordionContent),
  shadow: true,
})
export class QuiAccordionContent extends Mixin(ShadowStylesMixin, ControllerHostMixin) {
  @Element() host!: HTMLQuiAccordionContentElement;

  private contentEl?: HTMLElement;
  private ariaContentEl?: HTMLElement;
  private ariaTrigger?: AccordionTriggerRegistration;
  private readonly registration = new RegistrationReconciler();

  protected readonly contextPart = new ContextPartController(this, {
    context: accordionItemContext,
    getKey: () => this.item?.item().value,
  });

  private get item(): AccordionItemContext | undefined {
    return this.contextPart.context;
  }

  componentDidRender(): void {
    this.syncRegistration();
    this.syncAria();
  }

  disconnectedCallback(): void {
    this.registration.clear();
    super.disconnectedCallback();
  }

  private syncRegistration(): void {
    const item = this.contextPart.context;
    if (item === undefined) {
      return;
    }
    const { value } = item.item();
    this.registration.reconcile([item, value], () => item.registerContent(value, this.host));
  }

  private syncAria(): void {
    const { item } = this;
    const { contentEl } = this;
    if (!item || !contentEl) {
      return;
    }
    const trigger = item.getTrigger(item.item().value);
    if (this.ariaContentEl === contentEl && this.ariaTrigger === trigger) {
      return;
    }
    this.ariaContentEl = contentEl;
    this.ariaTrigger = trigger;
    setAriaLabelledBy(contentEl, trigger === undefined ? [] : [trigger.host]);
    if (trigger !== undefined) {
      // Set the reverse relationship so a late trigger registration is reflected too.
      setAriaControls(trigger.trigger, [this.host]);
    }
  }

  render(): VNode {
    const item = this.contextPart.context;
    const value = item?.item().value ?? "";
    const expanded = item?.isExpanded(value) ?? false;
    const focused = item?.isFocused(value) ?? false;
    const disabled = item?.isItemDisabled() ?? false;

    return (
      <Host id={item?.contentId(value)} class={styles.host}>
        <section
          ref={(el) => {
            this.contentEl = el;
          }}
          aria-labelledby={item?.triggerId(value)}
          data-scope="accordion"
          data-part="item-content"
          data-state={expanded ? "open" : "closed"}
          data-disabled={dataAttr(disabled)}
          data-focus={dataAttr(focused)}
          data-orientation={item?.orientation() ?? "vertical"}
          dir={item?.textDirection()}
          class={styles.content}
          part="content"
          inert={expanded ? undefined : true}
        >
          <div class={styles.body}>
            <div class={styles.padding}>
              <slot />
            </div>
          </div>
        </section>
      </Host>
    );
  }
}

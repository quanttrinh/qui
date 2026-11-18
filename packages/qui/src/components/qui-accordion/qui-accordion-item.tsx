import type { VNode } from "@stencil/core";

import { Mixin, resolveVar, Component, Element, h, Host, Prop, Watch } from "@stencil/core";

import { styleUrls } from "#qui-style-url";
import { css } from "#styled-system/css";
import { token } from "#styled-system/tokens";

import type { ContextProviderHandle } from "../shared/context";
import type { AccordionContext, AccordionItem, AccordionItemContext } from "./accordion-context";

import { ContextPartController } from "../shared/controllers";
import { dataAttr } from "../shared/helpers/aria/attr";
import { ControllerHostMixin, ShadowStylesMixin } from "../shared/mixins";
import { accordionContext, provideAccordionItem } from "./accordion-context";

const styles = {
  host: css({ display: "block" }),
  item: css({
    borderBlockEndWidth: "1px",
    borderColor: `var(--qui-accordion-border-color, ${token("colors.outlineVariant")})`,
    "&:last-child": { borderBlockEndWidth: "0" },
    "&[data-disabled]": { opacity: 0.38, cursor: "not-allowed" },
  }),
};

/**
 * A single accordion item.
 *
 * @slot - An accordion trigger and content.
 */
@Component({
  tag: "qui-accordion-item",
  styleUrl: resolveVar(styleUrls.quiAccordionItem),
  shadow: true,
})
export class QuiAccordionItem extends Mixin(ShadowStylesMixin, ControllerHostMixin) {
  @Element() host!: HTMLQuiAccordionItemElement;

  /** The value that identifies this item. */
  @Prop() value!: string;
  /** Disables this item. */
  @Prop() disabled = false;

  private itemProvider?: ContextProviderHandle<AccordionItemContext>;

  protected readonly contextPart = new ContextPartController(this, {
    context: accordionContext,
    // Keep in sync with render() and the post-render sync.
    select: (accordion) => [
      accordion.isExpanded(this.value),
      accordion.isFocused(this.value),
      this.isDisabled(accordion),
      accordion.orientation(),
      accordion.textDirection(),
      accordion.itemId(this.value),
    ],
    setup: (accordion): (() => void) => {
      this.itemProvider = provideAccordionItem(this.host, this.context(accordion));
      return () => {
        this.itemProvider?.clear();
        this.itemProvider = undefined;
      };
    },
    // Item context spreads the root, so forward root changes to item subscribers.
    onNotify: (): void => {
      this.itemProvider?.notify();
    },
  });

  @Watch("disabled")
  @Watch("value")
  private notifyItem(): void {
    this.itemProvider?.notify();
  }

  private isDisabled(accordion: AccordionContext): boolean {
    return this.disabled || accordion.isDisabled();
  }

  private item(): AccordionItem {
    return {
      value: this.value,
      disabled: this.disabled ? true : undefined,
    };
  }

  private context(accordion: AccordionContext): AccordionItemContext {
    return {
      ...accordion,
      item: () => this.item(),
      isItemDisabled: () => this.isDisabled(accordion),
    };
  }

  render(): VNode {
    const accordion = this.contextPart.context;
    const expanded = accordion?.isExpanded(this.value) ?? false;
    const focused = accordion?.isFocused(this.value) ?? false;
    const disabled = accordion === undefined ? this.disabled : this.isDisabled(accordion);

    return (
      <Host class={styles.host}>
        <div
          id={accordion?.itemId(this.value)}
          data-scope="accordion"
          data-part="item"
          data-state={expanded ? "open" : "closed"}
          data-focus={dataAttr(focused)}
          data-disabled={dataAttr(disabled)}
          data-orientation={accordion?.orientation() ?? "vertical"}
          dir={accordion?.textDirection()}
          class={styles.item}
          part="item"
        >
          <slot />
        </div>
      </Host>
    );
  }
}

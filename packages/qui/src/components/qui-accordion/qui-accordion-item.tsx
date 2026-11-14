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

import { ContextPartController, createListenerStore } from "../shared/controllers";
import { dataAttr } from "../shared/helpers/aria/attr";
import { shallowEqual } from "../shared/helpers/collection";
import { ControllerHostMixin, ShadowStylesMixin } from "../shared/mixins";
import {
  clearAccordionItem,
  accordionContext,
  provideAccordionItem,
  type AccordionContext,
  type AccordionItem,
  type AccordionItemContext,
} from "./accordion-context";

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

  private readonly listeners = createListenerStore();

  protected readonly contextPart = new ContextPartController(this, {
    context: accordionContext,
    select: (accordion) => [
      accordion.isExpanded(this.value),
      accordion.isFocused(this.value),
      this.isDisabled(accordion),
      accordion.orientation(),
      accordion.textDirection(),
      accordion.itemId(this.value),
    ],
    equals: shallowEqual,
    setup: (accordion): (() => void) => {
      provideAccordionItem(this.host, this.context(accordion));
      return () => {
        clearAccordionItem(this.host);
      };
    },
  });

  @Watch("disabled")
  @Watch("value")
  private notifyItem(): void {
    this.listeners.notify();
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
      subscribe: (listener, key) => {
        const stopItem = this.listeners.subscribe(listener);
        const stopAccordion = accordion.subscribe(listener, key);
        return () => {
          stopItem();
          stopAccordion();
        };
      },
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

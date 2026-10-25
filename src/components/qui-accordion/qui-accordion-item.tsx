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

import { styleUrls } from "#qui-style-url";
import { css, cx } from "#styled-system/css";

import { dataAttr } from "../../helpers/attr";
import {
  clearAccordionItem,
  consumeAccordion,
  provideAccordionItem,
  type AccordionContext,
  type AccordionItem,
  type AccordionItemContext,
} from "./accordion-context";

const styles = {
  host: css({ display: "block" }),
  item: css({
    borderBottomWidth: "1px",
    borderColor: "outlineVariant",
    "&:last-child": { borderBottomWidth: "0" },
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
  scoped: true,
})
export class QuiAccordionItem {
  @Element() host!: HTMLQuiAccordionItemElement;

  /** The value that identifies this item. */
  @Prop() value!: string;
  /** Disables this item. */
  @Prop() disabled = false;
  /** Additional class applied to the item element. */
  @Prop() innerClass?: string;

  private accordion?: AccordionContext;
  private unsubscribe?: () => void;

  public componentWillLoad(): void {
    this.attachAccordion();
  }

  public componentDidLoad(): void {
    if (this.accordion === undefined) {
      this.attachAccordion();
      forceUpdate(this.host);
    }
  }

  public disconnectedCallback(): void {
    clearAccordionItem(this.host);
    this.unsubscribe?.();
  }

  private attachAccordion(): void {
    const accordion = consumeAccordion(this.host);
    if (accordion === undefined || accordion === this.accordion) {
      return;
    }
    this.unsubscribe?.();
    this.accordion = accordion;
    this.unsubscribe = accordion.subscribe(() => {
      forceUpdate(this.host);
    });
    provideAccordionItem(this.host, this.context(accordion));
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
      item: (): AccordionItem => this.item(),
    };
  }

  public render(): VNode {
    const { accordion } = this;
    const expanded = accordion?.isExpanded(this.value) ?? false;
    const focused = accordion?.isFocused(this.value) ?? false;
    const disabled = this.disabled || (accordion?.isDisabled() ?? false);

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
          class={cx(styles.item, this.innerClass)}
          part="item"
        >
          <slot />
        </div>
      </Host>
    );
  }
}

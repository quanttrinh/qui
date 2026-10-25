import { resolveVar, Component, Element, h, Host, Prop, type VNode } from "@stencil/core";

import { styleUrls } from "#qui-style-url";
import { css, cx } from "#styled-system/css";

import { dataAttr } from "../../helpers/attr";
import { consumeContextPart } from "../shared/context-part";
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

  private readonly part = consumeContextPart({
    host: (): HTMLElement => this.host,
    consume: consumeAccordion,
    setup: (accordion): (() => void) => {
      provideAccordionItem(this.host, this.context(accordion));
      return (): void => {
        clearAccordionItem(this.host);
      };
    },
  });

  public componentWillLoad(): void {
    this.part.hostWillLoad();
  }

  public componentDidLoad(): void {
    this.part.hostDidLoad();
  }

  public disconnectedCallback(): void {
    this.part.hostDisconnected();
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
      item: (): AccordionItem => this.item(),
      isItemDisabled: (): boolean => this.isDisabled(accordion),
    };
  }

  public render(): VNode {
    const accordion = this.part.context;
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
          class={cx(styles.item, this.innerClass)}
          part="item"
        >
          <slot />
        </div>
      </Host>
    );
  }
}

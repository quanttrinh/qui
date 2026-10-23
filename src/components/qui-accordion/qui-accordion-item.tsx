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
import { type ItemProps } from "@zag-js/accordion";
import { spreadProps } from "@zag-js/vanilla";

import { styleUrls } from "#qui-style-url";
import { css, cx } from "#styled-system/css";

import {
  clearAccordionItem,
  consumeAccordion,
  provideAccordionItem,
  type AccordionContext,
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
  private spreads: (() => void)[] = [];
  private rootEl?: HTMLDivElement;

  public componentWillLoad(): void {
    this.attachAccordion();
  }

  public componentDidLoad(): void {
    if (this.accordion === undefined) {
      this.attachAccordion();
    }
  }

  public componentDidRender(): void {
    this.applySpreads();
  }

  public disconnectedCallback(): void {
    clearAccordionItem(this.host);
    for (const cleanup of this.spreads) {
      cleanup();
    }
    this.spreads = [];
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

  private item(): ItemProps {
    return { value: this.value, disabled: this.disabled };
  }

  private context(accordion: AccordionContext): AccordionItemContext {
    return {
      ...accordion,
      item: () => this.item(),
    };
  }

  private applySpreads(): void {
    if (this.rootEl === undefined || this.accordion === undefined) {
      return;
    }
    this.spreads = [
      spreadProps(this.rootEl, {
        ...this.accordion.api().getItemProps(this.item()),
        class: cx(styles.item, this.innerClass),
      }),
    ];
  }

  public render(): VNode {
    return (
      <Host class={styles.host}>
        <div
          ref={(el) => {
            if (el instanceof HTMLDivElement) {
              this.rootEl = el;
            }
          }}
          class={styles.item}
          part="item"
        >
          <slot />
        </div>
      </Host>
    );
  }
}

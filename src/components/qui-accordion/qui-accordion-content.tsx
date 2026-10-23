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
import { spreadProps } from "@zag-js/vanilla";

import { styleUrls } from "#qui-style-url";
import { css, cx } from "#styled-system/css";

import { consumeAccordionItem, type AccordionItemContext } from "./accordion-context";

const styles = {
  host: css({ display: "block" }),
  content: css({
    display: "grid",
    gridTemplateRows: "0fr",
    opacity: 0,
    transition: "grid-template-rows 200ms ease, opacity 200ms ease",
    "&[data-state=open]": {
      gridTemplateRows: "1fr",
      opacity: 1,
    },
  }),
  body: css({
    overflow: "hidden",
    minHeight: "0",
    // Skips layout/paint for collapsed or off-screen bodies. The intrinsic size
    // Reuses the last rendered height to keep the placeholder stable.
    contentVisibility: "auto",
    containIntrinsicSize: "auto 100px",
  }),
  padding: css({
    paddingX: "4",
    paddingY: "3",
    fontSize: "sm",
    color: "onSurfaceVariant",
  }),
};

/**
 * The collapsible content for a `qui-accordion-item`.
 *
 * @slot - Accordion body content.
 */
@Component({
  tag: "qui-accordion-content",
  styleUrl: resolveVar(styleUrls.quiAccordionContent),
  scoped: true,
})
export class QuiAccordionContent {
  @Element() host!: HTMLQuiAccordionContentElement;

  /** Additional class applied to the content element. */
  @Prop() innerClass?: string;

  private item?: AccordionItemContext;
  private unsubscribe?: () => void;
  private spreads: (() => void)[] = [];
  private contentEl?: HTMLDivElement;

  public componentWillLoad(): void {
    this.attachItem();
  }

  public componentDidLoad(): void {
    if (this.item === undefined) {
      this.attachItem();
    }
  }

  public componentDidRender(): void {
    this.applySpreads();
  }

  public disconnectedCallback(): void {
    for (const cleanup of this.spreads) {
      cleanup();
    }
    this.spreads = [];
    this.unsubscribe?.();
  }

  private attachItem(): void {
    const item = consumeAccordionItem(this.host);
    if (item === undefined || item === this.item) {
      return;
    }
    this.unsubscribe?.();
    this.item = item;
    this.unsubscribe = item.subscribe(() => {
      forceUpdate(this.host);
    });
  }

  private expanded(): boolean {
    if (this.item === undefined) {
      return false;
    }
    return this.item.api().getItemState(this.item.item()).expanded;
  }

  private applySpreads(): void {
    if (this.item === undefined || this.contentEl === undefined) {
      return;
    }
    // `hidden` would set `display: none`, which cancels the grid-row transition.
    // Collapse with `0fr` and rely on `inert` for the closed state instead.
    const contentProps = this.item.api().getItemContentProps(this.item.item());
    delete contentProps.hidden;
    this.spreads = [
      spreadProps(this.contentEl, {
        ...contentProps,
        class: cx(styles.content, this.innerClass),
      }),
    ];
  }

  public render(): VNode {
    const expanded = this.expanded();

    return (
      <Host class={styles.host}>
        <div
          ref={(el) => {
            if (el instanceof HTMLDivElement) {
              this.contentEl = el;
            }
          }}
          class={styles.content}
          part="content"
          inert={expanded ? undefined : true}
        >
          <div class={styles.body}>
            <div class={styles.padding}>
              <slot />
            </div>
          </div>
        </div>
      </Host>
    );
  }
}

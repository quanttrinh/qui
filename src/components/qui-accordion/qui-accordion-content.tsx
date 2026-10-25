import { resolveVar, Component, Element, h, Host, Prop, type VNode } from "@stencil/core";

import { styleUrls } from "#qui-style-url";
import { css, cx } from "#styled-system/css";

import { dataAttr } from "../../helpers/attr";
import { consumeContextPart } from "../shared/context-part";
import { consumeAccordionItem } from "./accordion-context";

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

  private readonly contextPart = consumeContextPart({
    host: (): HTMLElement => this.host,
    key: "accordion-item",
    consume: consumeAccordionItem,
  });

  public connectedCallback(): void {
    this.contextPart.hostConnected();
  }

  public componentWillLoad(): void {
    this.contextPart.hostWillLoad();
  }

  public componentDidLoad(): void {
    this.contextPart.hostDidLoad();
  }

  public disconnectedCallback(): void {
    this.contextPart.hostDisconnected();
  }

  public render(): VNode {
    const item = this.contextPart.context;
    const value = item?.item().value ?? "";
    const expanded = item?.isExpanded(value) ?? false;
    const focused = item?.isFocused(value) ?? false;
    const disabled = item?.isItemDisabled() ?? false;

    return (
      <Host class={styles.host}>
        <div
          id={item?.contentId(value)}
          role="region"
          aria-labelledby={item?.triggerId(value)}
          data-scope="accordion"
          data-part="item-content"
          data-state={expanded ? "open" : "closed"}
          data-disabled={dataAttr(disabled)}
          data-focus={dataAttr(focused)}
          data-orientation={item?.orientation() ?? "vertical"}
          dir={item?.textDirection()}
          class={cx(styles.content, this.innerClass)}
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

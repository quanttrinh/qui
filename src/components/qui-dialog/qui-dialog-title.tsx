import { resolveVar, Component, Element, h, Host, Prop, type VNode } from "@stencil/core";

import { styleUrls } from "#qui-style-url";
import { css, cx } from "#styled-system/css";

import { consumeContextPart } from "../shared/context-part";
import { consumeDialog, type DialogContext } from "./context";

const styles = {
  host: css({ display: "block" }),
  title: css({
    fontSize: "2xl",
    fontWeight: "normal",
    lineHeight: "snug",
    color: "onSurface",
  }),
};

/**
 * The dialog title. Wires the dialog's accessible name automatically.
 *
 * @slot - Title text.
 */
@Component({
  tag: "qui-dialog-title",
  styleUrl: resolveVar(styleUrls.quiDialogTitle),
  scoped: true,
})
export class QuiDialogTitle {
  @Element() host!: HTMLQuiDialogTitleElement;

  /** Additional class applied to the title. */
  @Prop() innerClass?: string;

  private readonly part = consumeContextPart({
    host: (): HTMLElement => this.host,
    consume: consumeDialog,
    subscribe: false,
  });

  private get dialog(): DialogContext | undefined {
    return this.part.context;
  }

  public componentWillLoad(): void {
    this.part.hostWillLoad();
  }

  public componentDidLoad(): void {
    this.part.hostDidLoad();
  }

  public disconnectedCallback(): void {
    this.part.hostDisconnected();
  }

  public render(): VNode {
    return (
      <Host class={styles.host}>
        <h2 id={this.dialog?.ids.title} class={cx(styles.title, this.innerClass)} part="title">
          <slot />
        </h2>
      </Host>
    );
  }
}

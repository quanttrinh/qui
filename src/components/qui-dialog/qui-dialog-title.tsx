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

  private readonly contextPart = consumeContextPart({
    host: (): HTMLElement => this.host,
    key: "dialog",
    consume: consumeDialog,
    subscribe: false,
  });

  private get dialog(): DialogContext | undefined {
    return this.contextPart.context;
  }

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
    return (
      <Host class={styles.host}>
        <h2 id={this.dialog?.ids.title} class={cx(styles.title, this.innerClass)} part="title">
          <slot />
        </h2>
      </Host>
    );
  }
}

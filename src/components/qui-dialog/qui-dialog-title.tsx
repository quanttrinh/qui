import { resolveVar, Component, Element, h, Host, type VNode } from "@stencil/core";

import { styleUrls } from "#qui-style-url";
import { css } from "#styled-system/css";

import { consumeContextPart } from "../shared/context-part";
import { ContextPartElement } from "../shared/context-part-element";
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
  shadow: true,
})
export class QuiDialogTitle extends ContextPartElement<DialogContext> {
  @Element() host!: HTMLQuiDialogTitleElement;

  protected readonly contextPart = consumeContextPart({
    host: (): HTMLElement => this.host,
    key: "dialog",
    consume: consumeDialog,
    setup: (dialog): (() => void) => dialog.registerTitle(this.host),
    subscribe: false,
  });

  private get dialog(): DialogContext | undefined {
    return this.contextPart.context;
  }

  public render(): VNode {
    return (
      <Host id={this.dialog?.ids.title} class={styles.host}>
        <h2 class={styles.title} part="title">
          <slot />
        </h2>
      </Host>
    );
  }
}

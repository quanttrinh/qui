import { resolveVar, Component, Element, h, Host, type VNode } from "@stencil/core";

import { styleUrls } from "#qui-style-url";
import { css } from "#styled-system/css";

import { consumeContextPart } from "../shared/context-part";
import { ContextPartElement } from "../shared/context-part-element";
import { consumeDialog, type DialogContext } from "./context";

const styles = {
  host: css({ display: "block" }),
  description: css({
    fontSize: "sm",
    color: "onSurfaceVariant",
  }),
};

/**
 * The dialog description.
 *
 * @slot - Description text.
 */
@Component({
  tag: "qui-dialog-description",
  styleUrl: resolveVar(styleUrls.quiDialogDescription),
  shadow: true,
})
export class QuiDialogDescription extends ContextPartElement<DialogContext> {
  @Element() host!: HTMLQuiDialogDescriptionElement;

  protected readonly contextPart = consumeContextPart({
    host: (): HTMLElement => this.host,
    key: "dialog",
    consume: consumeDialog,
    setup: (dialog): (() => void) => dialog.registerDescription(this.host),
    subscribe: false,
  });

  private get dialog(): DialogContext | undefined {
    return this.contextPart.context;
  }

  public render(): VNode {
    return (
      <Host id={this.dialog?.ids.description} class={styles.host}>
        <p class={styles.description} part="description">
          <slot />
        </p>
      </Host>
    );
  }
}

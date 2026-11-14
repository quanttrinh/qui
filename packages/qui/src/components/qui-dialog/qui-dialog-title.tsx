import { Mixin, resolveVar, Component, Element, h, Host, type VNode } from "@stencil/core";

import { styleUrls } from "#qui-style-url";
import { css } from "#styled-system/css";

import { token } from "../../../styled-system/tokens";
import { ContextPartController } from "../shared/controllers";
import { ControllerHostMixin } from "../shared/mixins";
import { consumeDialog, type DialogContext } from "./context";

const styles = {
  host: css({ display: "block" }),
  title: css({
    textStyle: "2xl",
    lineHeight: "snug",
    color: `var(--qui-dialog-title-color, ${token("colors.onSurface")})`,
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
export class QuiDialogTitle extends Mixin(ControllerHostMixin) {
  @Element() host!: HTMLQuiDialogTitleElement;

  protected readonly contextPart = new ContextPartController(this, {
    key: "dialog",
    consume: consumeDialog,
    setup: (dialog): (() => void) => dialog.registerTitle(this.host),
    subscribe: false,
  });

  private get dialog(): DialogContext | undefined {
    return this.contextPart.context;
  }

  render(): VNode {
    return (
      <Host id={this.dialog?.ids.title} class={styles.host}>
        <h2 class={styles.title} part="title">
          <slot />
        </h2>
      </Host>
    );
  }
}

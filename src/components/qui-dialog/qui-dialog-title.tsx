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

  private dialog?: DialogContext;

  public componentWillLoad(): void {
    this.attachDialog();
  }

  public componentDidLoad(): void {
    if (this.dialog === undefined) {
      this.attachDialog();
      forceUpdate(this.host);
    }
  }

  private attachDialog(): void {
    const dialog = consumeDialog(this.host);
    if (dialog === undefined || dialog === this.dialog) {
      return;
    }
    this.dialog = dialog;
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

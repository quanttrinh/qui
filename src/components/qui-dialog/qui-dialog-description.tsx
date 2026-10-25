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
  scoped: true,
})
export class QuiDialogDescription {
  @Element() host!: HTMLQuiDialogDescriptionElement;

  /** Additional class applied to the description. */
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
        <p
          id={this.dialog?.ids.description}
          class={cx(styles.description, this.innerClass)}
          part="description"
        >
          <slot />
        </p>
      </Host>
    );
  }
}

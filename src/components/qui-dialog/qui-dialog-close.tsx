import { resolveVar, Component, Element, h, Host, Prop, type VNode } from "@stencil/core";

import { styleUrls } from "#qui-style-url";
import { css, cx } from "#styled-system/css";

import { consumeDialog } from "./dialog-context";

const styles = {
  host: css({ display: "inline-block" }),
  button: css({
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    height: "10",
    paddingInline: "4",
    borderWidth: "0",
    rounded: "full",
    backgroundColor: "transparent",
    color: "primary",
    font: "inherit",
    fontSize: "sm",
    fontWeight: "medium",
    cursor: "pointer",
    "&:hover": { backgroundColor: "surfaceContainerHigh" },
    "&:focus-visible": {
      outlineWidth: "2px",
      outlineStyle: "solid",
      outlineColor: "primary",
      outlineOffset: "2px",
    },
  }),
};

/**
 * A button that closes the surrounding `qui-dialog`.
 *
 * @slot - Close button label.
 */
@Component({
  tag: "qui-dialog-close",
  styleUrl: resolveVar(styleUrls.quiDialogClose),
  scoped: true,
})
export class QuiDialogClose {
  @Element() host!: HTMLQuiDialogCloseElement;

  /** Additional class applied to the close button. */
  @Prop() innerClass?: string;

  public render(): VNode {
    return (
      <Host class={styles.host}>
        <button
          class={cx(styles.button, this.innerClass)}
          part="close"
          type="button"
          onClick={() => {
            consumeDialog(this.host)?.requestClose();
          }}
        >
          <slot />
        </button>
      </Host>
    );
  }
}

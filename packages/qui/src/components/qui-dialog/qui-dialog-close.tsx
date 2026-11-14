import { Mixin, resolveVar, Component, Element, h, Host, type VNode } from "@stencil/core";

import { styleUrls } from "#qui-style-url";
import { css } from "#styled-system/css";

import { ShadowStylesMixin } from "../shared/mixins";
import { dialogButtonBase } from "../shared/styles";
import { dialogContext } from "./context";

const styles = {
  host: css({ display: "inline-block" }),
  button: css({ ...dialogButtonBase }),
};

/**
 * A button that closes the surrounding `qui-dialog`.
 *
 * @slot - Close button label.
 */
@Component({
  tag: "qui-dialog-close",
  styleUrl: resolveVar(styleUrls.quiDialogClose),
  shadow: true,
})
export class QuiDialogClose extends Mixin(ShadowStylesMixin) {
  @Element() host!: HTMLQuiDialogCloseElement;

  render(): VNode {
    return (
      <Host class={styles.host}>
        {/* The label is provided by the slotted button content. */}
        {/* oxlint-disable-next-line jsx-a11y/control-has-associated-label */}
        <button
          class={styles.button}
          part="close"
          type="button"
          onClick={() => {
            dialogContext.consume(this.host)?.requestClose();
          }}
        >
          <slot />
        </button>
      </Host>
    );
  }
}

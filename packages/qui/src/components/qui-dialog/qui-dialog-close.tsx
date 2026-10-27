import { resolveVar, Component, Element, h, Host, type VNode } from "@stencil/core";

import { styleUrls } from "#qui-style-url";
import { css } from "#styled-system/css";

import { ensureShadowStylesheet } from "../../utilities/styles";
import { dialogButtonBase } from "../shared/styles";
import { consumeDialog } from "./context";

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
export class QuiDialogClose {
  @Element() host!: HTMLQuiDialogCloseElement;

  public connectedCallback(): void {
    ensureShadowStylesheet(this.host);
  }

  public render(): VNode {
    return (
      <Host class={styles.host}>
        {/* The label is provided by the slotted button content. */}
        {/* oxlint-disable-next-line jsx-a11y/control-has-associated-label */}
        <button
          class={styles.button}
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

import { resolveVar, Component, Element, h, Host, type VNode } from "@stencil/core";

import { styleUrls } from "#qui-style-url";
import { css } from "#styled-system/css";

import { ensureShadowStylesheet } from "../../utilities/styles";

const styles = {
  host: css({ display: "block" }),
  actions: css({
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: "2",
    paddingBlockStart: "2",
  }),
};

/**
 * A right-aligned row of dialog actions.
 *
 * @slot - Action buttons.
 */
@Component({
  tag: "qui-dialog-actions",
  styleUrl: resolveVar(styleUrls.quiDialogActions),
  shadow: true,
})
export class QuiDialogActions {
  @Element() host!: HTMLElement;

  connectedCallback(): void {
    ensureShadowStylesheet(this.host);
  }

  render(): VNode {
    return (
      <Host class={styles.host}>
        <div class={styles.actions} part="actions">
          <slot />
        </div>
      </Host>
    );
  }
}

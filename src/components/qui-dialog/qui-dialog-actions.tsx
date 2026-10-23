import { resolveVar, Component, h, Host, Prop, type VNode } from "@stencil/core";

import { styleUrls } from "#qui-style-url";
import { css, cx } from "#styled-system/css";

const styles = {
  host: css({ display: "block" }),
  actions: css({
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: "2",
    marginBlockStart: "2",
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
  scoped: true,
})
export class QuiDialogActions {
  /** Additional class applied to the action row. */
  @Prop() innerClass?: string;

  public render(): VNode {
    return (
      <Host class={styles.host}>
        <div class={cx(styles.actions, this.innerClass)} part="actions">
          <slot />
        </div>
      </Host>
    );
  }
}

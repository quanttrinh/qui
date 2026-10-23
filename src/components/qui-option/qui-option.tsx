import { Component, Element, h, Host, Prop, resolveVar, type VNode } from "@stencil/core";

import { styleUrls } from "#qui-style-url";
import { css } from "#styled-system/css";

const styles = {
  host: css({ display: "none" }),
};

/**
 * A data-only option used by `qui-select` and `qui-combobox`.
 *
 * @slot - The option label.
 */
@Component({
  tag: "qui-option",
  styleUrl: resolveVar(styleUrls.quiOption),
  scoped: true,
})
export class QuiOption {
  @Element() host!: HTMLQuiOptionElement;

  /** The submitted value. */
  @Prop() value!: string;
  /** Disables the option. */
  @Prop() disabled = false;
  /** Explicit label. Defaults to the slotted text. */
  @Prop() label?: string;

  public render(): VNode {
    return (
      <Host class={styles.host}>
        <slot />
      </Host>
    );
  }
}

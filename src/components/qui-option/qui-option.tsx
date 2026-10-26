import { Component, Element, h, Host, Prop, resolveVar, type VNode } from "@stencil/core";

import { styleUrls } from "#qui-style-url";
import { css } from "#styled-system/css";

import { ensureShadowStylesheet } from "../../utilities/styles";

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
  shadow: true,
})
export class QuiOption {
  @Element() host!: HTMLQuiOptionElement;

  /** The submitted value. */
  @Prop({ reflect: true }) value!: string;
  /** Disables the option. */
  @Prop({ reflect: true }) disabled = false;
  /** Explicit label. Defaults to the slotted text. */
  @Prop({ reflect: true }) label?: string;
  /** Extra text matched by the combobox filter, e.g. synonyms or aliases. */
  @Prop({ reflect: true }) keywords?: string;

  public connectedCallback(): void {
    ensureShadowStylesheet(this.host);
  }

  public render(): VNode {
    return (
      <Host class={styles.host}>
        <slot />
      </Host>
    );
  }
}

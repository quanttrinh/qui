import { Mixin, resolveVar, Component, Element, h, Host, type VNode } from "@stencil/core";

import { styleUrls } from "#qui-style-url";
import { css, cx } from "#styled-system/css";

import { FieldPartController } from "../shared/controllers";
import { type FieldApi } from "../shared/helpers/field";
import { ControllerHostMixin } from "../shared/mixins";
import { fieldStyles } from "./styles";

const styles = {
  host: css({ display: "block" }),
};

/**
 * Helper text for a `qui-field`. Registers itself so the control receives an
 * `aria-describedby` pointing at this element.
 *
 * @slot - Helper text content.
 */
@Component({
  tag: "qui-field-helper-text",
  styleUrl: resolveVar(styleUrls.quiFieldHelperText),
  shadow: true,
})
export class QuiFieldHelperText extends Mixin(ControllerHostMixin) {
  @Element() host!: HTMLQuiFieldHelperTextElement;

  protected readonly fieldPart = new FieldPartController(this, { part: "helper-text" });

  private get field(): FieldApi | undefined {
    return this.fieldPart.field;
  }

  render(): VNode {
    const props = this.field?.getHelperTextProps();

    return (
      <Host
        id={props?.id}
        data-scope="field"
        data-part="helper-text"
        data-disabled={props?.["data-disabled"]}
        class={cx(styles.host, fieldStyles.helperText)}
        part="helper-text"
      >
        <slot />
      </Host>
    );
  }
}

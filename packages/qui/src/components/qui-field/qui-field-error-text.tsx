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
 * Error text for a `qui-field`. Only visible while the field is invalid.
 *
 * @slot - Error text content.
 */
@Component({
  tag: "qui-field-error-text",
  styleUrl: resolveVar(styleUrls.quiFieldErrorText),
  shadow: true,
})
export class QuiFieldErrorText extends Mixin(ControllerHostMixin) {
  @Element() host!: HTMLQuiFieldErrorTextElement;

  protected readonly fieldPart = new FieldPartController(this, { part: "error-text" });

  private get field(): FieldApi | undefined {
    return this.fieldPart.field;
  }

  render(): VNode {
    const invalid = this.field?.invalid() ?? false;
    const props = this.field?.getErrorTextProps();

    return (
      <Host
        id={props?.id}
        data-scope="field"
        data-part="error-text"
        data-invalid={invalid ? "" : undefined}
        aria-live="polite"
        class={cx(styles.host, fieldStyles.errorText)}
        part="error-text"
      >
        <slot />
      </Host>
    );
  }
}

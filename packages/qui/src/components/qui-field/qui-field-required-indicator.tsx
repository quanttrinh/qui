import { Mixin, resolveVar, Component, Element, h, Host, type VNode } from "@stencil/core";

import { styleUrls } from "#qui-style-url";
import { css, cx } from "#styled-system/css";

import { FieldPartController } from "../shared/controllers";
import { type FieldApi } from "../shared/helpers/field";
import { ControllerHostMixin } from "../shared/mixins";
import { requiredIndicatorStyle } from "../shared/styles";

const styles = {
  host: css({ display: "inline" }),
};

/**
 * Required marker for a `qui-field`.
 *
 * @slot - Custom marker content. Defaults to `*`.
 */
@Component({
  tag: "qui-field-required-indicator",
  styleUrl: resolveVar(styleUrls.quiFieldRequiredIndicator),
  shadow: true,
})
export class QuiFieldRequiredIndicator extends Mixin(ControllerHostMixin) {
  @Element() host!: HTMLQuiFieldRequiredIndicatorElement;

  protected readonly fieldPart = new FieldPartController(this, { part: "required-indicator" });
  private readonly defaultMarker = "*";

  private get field(): FieldApi | undefined {
    return this.fieldPart.field;
  }

  render(): VNode {
    const required = this.field?.required() ?? false;

    return (
      <Host
        data-scope="field"
        data-part="required-indicator"
        aria-hidden="true"
        data-required={required ? "" : undefined}
        class={cx(styles.host, requiredIndicatorStyle)}
        part="required-indicator"
      >
        <slot>{this.defaultMarker}</slot>
      </Host>
    );
  }
}

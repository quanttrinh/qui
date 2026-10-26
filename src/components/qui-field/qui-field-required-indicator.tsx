import { resolveVar, Component, Element, h, Host, type VNode } from "@stencil/core";

import { styleUrls } from "#qui-style-url";
import { css, cx } from "#styled-system/css";

import { consumeContextPart } from "../shared/context-part";
import { ContextPartElement } from "../shared/context-part-element";
import { consumeField, type FieldApi } from "../shared/field/context";
import { requiredIndicatorStyle } from "../shared/required-indicator";

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
export class QuiFieldRequiredIndicator extends ContextPartElement<FieldApi> {
  @Element() host!: HTMLQuiFieldRequiredIndicatorElement;

  protected readonly contextPart = consumeContextPart({
    host: (): HTMLElement => this.host,
    key: "field",
    consume: consumeField,
  });
  private readonly defaultMarker = "*";

  private get field(): FieldApi | undefined {
    return this.contextPart.context;
  }

  public render(): VNode {
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

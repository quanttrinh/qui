import { resolveVar, Component, Element, h, Host, type VNode } from "@stencil/core";

import { styleUrls } from "#qui-style-url";
import { css, cx } from "#styled-system/css";

import { consumeContextPart } from "../shared/context-part";
import { ContextPartElement } from "../shared/context-part-element";
import { consumeField, type FieldApi } from "../shared/field/context";
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
export class QuiFieldErrorText extends ContextPartElement<FieldApi> {
  @Element() host!: HTMLQuiFieldErrorTextElement;

  protected readonly needsShadowStyles = false;

  protected readonly contextPart = consumeContextPart({
    host: (): HTMLElement => this.host,
    key: "field",
    consume: consumeField,
    setup: (field): (() => void) => {
      this.host.id = field.getErrorTextProps().id;
      return field.registerErrorText(this.host);
    },
  });

  private get field(): FieldApi | undefined {
    return this.contextPart.context;
  }

  public render(): VNode {
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

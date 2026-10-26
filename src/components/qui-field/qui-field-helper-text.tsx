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
export class QuiFieldHelperText extends ContextPartElement<FieldApi> {
  @Element() host!: HTMLQuiFieldHelperTextElement;

  protected readonly contextPart = consumeContextPart({
    host: (): HTMLElement => this.host,
    key: "field",
    consume: consumeField,
    setup: (field): (() => void) => {
      this.host.id = field.getHelperTextProps().id;
      return field.registerHelperText(this.host);
    },
  });

  private get field(): FieldApi | undefined {
    return this.contextPart.context;
  }

  public render(): VNode {
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

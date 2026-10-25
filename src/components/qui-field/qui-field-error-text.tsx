import { resolveVar, Component, Element, h, Host, Prop, type VNode } from "@stencil/core";

import { styleUrls } from "#qui-style-url";
import { css, cx } from "#styled-system/css";

import { consumeContextPart } from "../shared/context-part";
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
  scoped: true,
})
export class QuiFieldErrorText {
  @Element() host!: HTMLQuiFieldErrorTextElement;

  /** Additional class applied to the error text element. */
  @Prop() innerClass?: string;

  private readonly part = consumeContextPart({
    host: (): HTMLElement => this.host,
    consume: consumeField,
    setup: (field): (() => void) => field.registerErrorText(),
  });

  private get field(): FieldApi | undefined {
    return this.part.context;
  }

  public componentWillLoad(): void {
    this.part.hostWillLoad();
  }

  public componentDidLoad(): void {
    this.part.hostDidLoad();
  }

  public disconnectedCallback(): void {
    this.part.hostDisconnected();
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
        class={cx(styles.host, fieldStyles.errorText, this.innerClass)}
        part="error-text"
      >
        <slot />
      </Host>
    );
  }
}

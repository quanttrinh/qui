import {
  resolveVar,
  Component,
  Element,
  forceUpdate,
  h,
  Host,
  Prop,
  type VNode,
} from "@stencil/core";

import { styleUrls } from "#qui-style-url";
import { css, cx } from "#styled-system/css";

import { consumeField, type FieldApi } from "./field-context";
import { fieldStyles } from "./field-styles";

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

  private field?: FieldApi;
  private unsubscribe?: () => void;
  private unregister?: () => void;

  public componentWillLoad(): void {
    this.attachField();
  }

  public componentDidLoad(): void {
    if (this.field === undefined) {
      this.attachField();
    }
  }

  public disconnectedCallback(): void {
    this.unregister?.();
    this.unsubscribe?.();
  }

  private attachField(): void {
    const field = consumeField(this.host);
    if (field === undefined || field === this.field) {
      return;
    }
    this.unregister?.();
    this.unsubscribe?.();
    this.field = field;
    this.unregister = field.registerErrorText();
    this.unsubscribe = field.subscribe(() => {
      forceUpdate(this.host);
    });
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

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
  scoped: true,
})
export class QuiFieldHelperText {
  @Element() host!: HTMLQuiFieldHelperTextElement;

  /** Additional class applied to the helper text element. */
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
    this.unregister = field.registerHelperText();
    this.unsubscribe = field.subscribe(() => {
      forceUpdate(this.host);
    });
  }

  public render(): VNode {
    const props = this.field?.getHelperTextProps();

    return (
      <Host
        id={props?.id}
        data-scope="field"
        data-part="helper-text"
        data-disabled={props?.["data-disabled"]}
        class={cx(styles.host, fieldStyles.helperText, this.innerClass)}
        part="helper-text"
      >
        <slot />
      </Host>
    );
  }
}

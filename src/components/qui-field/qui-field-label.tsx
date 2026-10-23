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
 * The label part of a `qui-field`.
 *
 * @slot - Label content.
 */
@Component({
  tag: "qui-field-label",
  styleUrl: resolveVar(styleUrls.quiFieldLabel),
  scoped: true,
})
export class QuiFieldLabel {
  @Element() host!: HTMLQuiFieldLabelElement;

  /** Additional class applied to the label element. */
  @Prop() innerClass?: string;

  private field?: FieldApi;
  private unsubscribe?: () => void;

  public componentWillLoad(): void {
    this.attachField();
  }

  public componentDidLoad(): void {
    if (this.field === undefined) {
      this.attachField();
    }
  }

  public disconnectedCallback(): void {
    this.unsubscribe?.();
  }

  private attachField(): void {
    const field = consumeField(this.host);
    if (field === undefined || field === this.field) {
      return;
    }
    this.unsubscribe?.();
    this.field = field;
    this.unsubscribe = field.subscribe(() => {
      forceUpdate(this.host);
    });
  }

  public render(): VNode {
    const props = this.field?.getLabelProps();

    return (
      <Host class={styles.host}>
        <label
          id={props?.id}
          htmlFor={props?.htmlFor}
          data-scope="field"
          data-part="label"
          data-disabled={props?.["data-disabled"]}
          data-invalid={props?.["data-invalid"]}
          data-readonly={props?.["data-readonly"]}
          data-required={props?.["data-required"]}
          class={cx(fieldStyles.label, this.innerClass)}
          part="label"
        >
          <slot />
        </label>
      </Host>
    );
  }
}

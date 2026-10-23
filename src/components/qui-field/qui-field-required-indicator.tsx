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
  scoped: true,
})
export class QuiFieldRequiredIndicator {
  @Element() host!: HTMLQuiFieldRequiredIndicatorElement;

  /** Additional class applied to the indicator element. */
  @Prop() innerClass?: string;

  private field?: FieldApi;
  private unsubscribe?: () => void;
  private readonly defaultMarker = "*";

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
    const required = this.field?.required() ?? false;

    return (
      <Host
        data-scope="field"
        data-part="required-indicator"
        aria-hidden="true"
        data-required={required ? "" : undefined}
        class={cx(styles.host, fieldStyles.requiredIndicator, this.innerClass)}
        part="required-indicator"
      >
        <slot>{this.defaultMarker}</slot>
      </Host>
    );
  }
}

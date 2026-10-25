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

  private readonly contextPart = consumeContextPart({
    host: (): HTMLElement => this.host,
    key: "field",
    consume: consumeField,
  });

  private get field(): FieldApi | undefined {
    return this.contextPart.context;
  }

  public connectedCallback(): void {
    this.contextPart.hostConnected();
  }

  public componentWillLoad(): void {
    this.contextPart.hostWillLoad();
  }

  public componentDidLoad(): void {
    this.contextPart.hostDidLoad();
  }

  public disconnectedCallback(): void {
    this.contextPart.hostDisconnected();
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

import { resolveVar, Component, Element, h, Host, Prop, type VNode } from "@stencil/core";

import { styleUrls } from "#qui-style-url";
import { css, cx } from "#styled-system/css";

import { consumeContextPart } from "../shared/context-part";
import { consumeField, type FieldApi } from "../shared/field/context";
import { fieldStyles } from "./styles";

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

  private readonly part = consumeContextPart({
    host: (): HTMLElement => this.host,
    key: "field",
    consume: consumeField,
  });
  private readonly defaultMarker = "*";

  private get field(): FieldApi | undefined {
    return this.part.context;
  }

  public connectedCallback(): void {
    this.part.hostConnected();
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

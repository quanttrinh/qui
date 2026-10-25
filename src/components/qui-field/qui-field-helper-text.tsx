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

  private readonly contextPart = consumeContextPart({
    host: (): HTMLElement => this.host,
    key: "field",
    consume: consumeField,
    setup: (field): (() => void) => field.registerHelperText(),
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

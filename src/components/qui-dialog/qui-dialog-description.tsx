import { resolveVar, Component, Element, h, Host, Prop, type VNode } from "@stencil/core";

import { styleUrls } from "#qui-style-url";
import { css, cx } from "#styled-system/css";

import { consumeContextPart } from "../shared/context-part";
import { consumeDialog, type DialogContext } from "./context";

const styles = {
  host: css({ display: "block" }),
  description: css({
    fontSize: "sm",
    color: "onSurfaceVariant",
  }),
};

/**
 * The dialog description.
 *
 * @slot - Description text.
 */
@Component({
  tag: "qui-dialog-description",
  styleUrl: resolveVar(styleUrls.quiDialogDescription),
  scoped: true,
})
export class QuiDialogDescription {
  @Element() host!: HTMLQuiDialogDescriptionElement;

  /** Additional class applied to the description. */
  @Prop() innerClass?: string;

  private readonly contextPart = consumeContextPart({
    host: (): HTMLElement => this.host,
    key: "dialog",
    consume: consumeDialog,
    subscribe: false,
  });

  private get dialog(): DialogContext | undefined {
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
    return (
      <Host class={styles.host}>
        <p
          id={this.dialog?.ids.description}
          class={cx(styles.description, this.innerClass)}
          part="description"
        >
          <slot />
        </p>
      </Host>
    );
  }
}

import { resolveVar, Component, Element, h, Host, Prop, type VNode } from "@stencil/core";

import { styleUrls } from "#qui-style-url";
import { css } from "#styled-system/css";

import { consumeContextPart } from "../shared/context-part";
import { ContextPartElement } from "../shared/context-part-element";
import { dialogButtonBase } from "../shared/styles";
import { consumeDialog, type DialogContext } from "./context";

const styles = {
  host: css({ display: "inline-block" }),
  button: css({
    ...dialogButtonBase,
    "&:disabled": { opacity: 0.38, cursor: "not-allowed" },
  }),
};

/**
 * Opens a `qui-dialog`.
 *
 * @slot - Trigger label.
 */
@Component({
  tag: "qui-dialog-trigger",
  styleUrl: resolveVar(styleUrls.quiDialogTrigger),
  shadow: true,
})
export class QuiDialogTrigger extends ContextPartElement<DialogContext> {
  @Element() host!: HTMLQuiDialogTriggerElement;

  /** Disables the trigger. */
  @Prop() disabled = false;

  protected readonly contextPart = consumeContextPart({
    host: (): HTMLElement => this.host,
    key: "dialog",
    consume: consumeDialog,
  });

  private get dialog(): DialogContext | undefined {
    return this.contextPart.context;
  }

  public render(): VNode {
    const open = this.dialog?.open() ?? false;

    return (
      <Host class={styles.host}>
        {/* The label is provided by the slotted button content. */}
        {/* oxlint-disable-next-line jsx-a11y/control-has-associated-label */}
        <button
          class={styles.button}
          part="trigger"
          type="button"
          disabled={this.disabled}
          aria-haspopup="dialog"
          aria-expanded={open ? "true" : "false"}
          onClick={() => {
            this.dialog?.requestOpen();
          }}
        >
          <slot />
        </button>
      </Host>
    );
  }
}

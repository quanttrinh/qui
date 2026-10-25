import { resolveVar, Component, Element, h, Host, Prop, type VNode } from "@stencil/core";

import { styleUrls } from "#qui-style-url";
import { css, cx } from "#styled-system/css";

import { consumeContextPart } from "../shared/context-part";
import { consumeDialog, type DialogContext } from "./context";

const styles = {
  host: css({ display: "inline-block" }),
  button: css({
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    height: "10",
    paddingInline: "4",
    borderWidth: "0",
    rounded: "full",
    backgroundColor: "transparent",
    color: "primary",
    font: "inherit",
    fontSize: "sm",
    fontWeight: "medium",
    cursor: "pointer",
    "&:hover": { backgroundColor: "surfaceContainerHigh" },
    "&:focus-visible": {
      outlineWidth: "2px",
      outlineStyle: "solid",
      outlineColor: "primary",
      outlineOffset: "2px",
    },
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
  scoped: true,
})
export class QuiDialogTrigger {
  @Element() host!: HTMLQuiDialogTriggerElement;

  /** Disables the trigger. */
  @Prop() disabled = false;
  /** Additional class applied to the trigger button. */
  @Prop() innerClass?: string;

  private readonly part = consumeContextPart({
    host: (): HTMLElement => this.host,
    consume: consumeDialog,
  });

  private get dialog(): DialogContext | undefined {
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
    const open = this.dialog?.open() ?? false;

    return (
      <Host class={styles.host}>
        <button
          class={cx(styles.button, this.innerClass)}
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

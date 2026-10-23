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

import { consumeDialog, type DialogContext } from "./dialog-context";

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

  private dialog?: DialogContext;
  private unsubscribe?: () => void;

  public componentWillLoad(): void {
    this.attachDialog();
  }

  public componentDidLoad(): void {
    if (this.dialog === undefined) {
      this.attachDialog();
    }
  }

  public disconnectedCallback(): void {
    this.unsubscribe?.();
  }

  private attachDialog(): void {
    const dialog = consumeDialog(this.host);
    if (dialog === undefined || dialog === this.dialog) {
      return;
    }
    this.unsubscribe?.();
    this.dialog = dialog;
    this.unsubscribe = dialog.subscribe(() => {
      forceUpdate(this.host);
    });
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

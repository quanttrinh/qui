import {
  Mixin,
  Build,
  resolveVar,
  Component,
  Element,
  h,
  Host,
  State,
  type VNode,
} from "@stencil/core";

import { styleUrls } from "#qui-style-url";
import { css } from "#styled-system/css";

import { token } from "../../../styled-system/tokens";
import { ContextPartController } from "../shared/controllers";
import { ControllerHostMixin } from "../shared/mixins";
import { consumeDialog, type DialogContext, type DialogControl } from "./context";
import { applyDialogAria } from "./dialog-aria";

const styles = {
  host: css({ display: "contents" }),
  dialog: css({
    m: "auto", // oxlint-disable-line @pandacss/no-margin-properties -- Centers the native dialog.
    p: 0,
    borderWidth: 0,
    bgColor: "transparent",
    maxW: "none",
    maxH: "none",
    color: `var(--qui-dialog-text-color, ${token("colors.onSurface")})`,
    outlineStyle: "none",
    // Keeps the surface shadow from being clipped; the surface scrolls itself.
    overflow: "visible",
    "&::backdrop": {
      bgColor: `var(--qui-dialog-backdrop-color, ${token("colors.scrim")})`,
      opacity: 0.32,
    },
    "&:focus-visible": {
      outlineStyle: "none",
    },
  }),
  surface: css({
    display: "flex",
    flexDir: "column",
    gap: "4",
    w: "full",
    minW: "72",
    maxW: "xl",
    maxH: "calc(100dvh - 2rem)",
    overflowY: "auto",
    p: "6",
    rounded: "3xl",
    bgColor: `var(--qui-dialog-surface-color, ${token("colors.surfaceContainerHigh")})`,
    shadow: "xl",
    color: `var(--qui-dialog-text-color, ${token("colors.onSurface")})`,
  }),
};

/**
 * The native `<dialog>` surface for `qui-dialog`.
 *
 * @slot - Dialog title, description, body, and actions.
 * @undefinedContent
 */
@Component({
  tag: "qui-dialog-content",
  styleUrl: resolveVar(styleUrls.quiDialogContent),
  shadow: true,
})
export class QuiDialogContent extends Mixin(ControllerHostMixin) {
  @Element() host!: HTMLQuiDialogContentElement;

  @State() private dialogRole: "dialog" | "alertdialog" = "dialog";
  @State() private dialogLabel?: string;

  protected readonly contextPart = new ContextPartController(this, {
    key: "dialog",
    consume: consumeDialog,
    update: (): void => {
      this.applyDialogAttributes();
    },
    setup: () => {
      this.registerControl();
      return () => {
        this.detachDocumentListeners();
        this.unregister?.();
        this.unregister = undefined;
      };
    },
  });

  private unregister?: () => void;
  private dialogEl?: HTMLDialogElement;
  private modalState?: boolean;
  private appliedDialog?: HTMLDialogElement;
  private appliedClosedBy?: string;
  private appliedTitle?: HTMLElement;
  private appliedDescription?: HTMLElement;
  private pointerHandler?: (event: PointerEvent) => void;
  private keyHandler?: (event: KeyboardEvent) => void;

  private get dialogContext(): DialogContext | undefined {
    return this.contextPart.context;
  }

  componentDidLoad(): void {
    super.componentDidLoad();
    // The native <dialog> ref does not exist during componentWillLoad.
    // The first registration therefore waits until after the initial render.
    this.registerControl();
    this.applyDialogAttributes();
  }

  componentDidRender(): void {
    this.applyDialogAttributes();
  }

  private registerControl(): void {
    const context = this.dialogContext;
    if (!context || this.unregister || !this.dialogEl) {
      return;
    }
    this.unregister = context.register(this.control());
    this.attachDocumentListeners();
  }

  private control(): DialogControl {
    return {
      show: (modal) => {
        this.showDialog(modal);
      },
      close: (returnValue) => {
        this.dialogEl?.close(returnValue ?? "");
      },
      isOpen: () => this.dialogEl?.open ?? false,
      setModal: (modal) => {
        this.setModal(modal);
      },
      setClosedBy: (value) => {
        if (this.dialogEl !== undefined && "closedBy" in this.dialogEl) {
          Object.assign(this.dialogEl, { closedBy: value });
          this.appliedClosedBy = value;
        }
      },
      setRole: (role) => {
        this.dialogRole = role;
      },
      setLabel: (label) => {
        this.dialogLabel = label;
      },
    };
  }

  private showDialog(modal: boolean): void {
    const dialog = this.dialogEl;
    if (!dialog || dialog.open) {
      return;
    }
    this.modalState = modal;
    if (modal) {
      dialog.showModal();
    } else {
      dialog.show();
    }
    this.dialogContext?.notifyOpen(true, "");
  }

  private setModal(modal: boolean): void {
    const dialog = this.dialogEl;
    if (!dialog || !dialog.open || this.modalState === modal) {
      this.modalState = modal;
      return;
    }
    this.modalState = modal;
    // Changing modality requires reopening the native dialog.
    dialog.close();
    if (modal) {
      dialog.showModal();
    } else {
      dialog.show();
    }
    this.detachDocumentListeners();
    this.attachDocumentListeners();
  }

  private closeDialog(returnValue = ""): void {
    this.dialogEl?.close(returnValue);
  }

  private applyDialogAttributes(): void {
    const dialog = this.dialogEl;
    const context = this.dialogContext;
    if (!dialog || !context) {
      return;
    }

    const closedBy: string = context.closeOnInteractOutside() ? "any" : "closerequest";
    if (
      "closedBy" in dialog &&
      (dialog !== this.appliedDialog || closedBy !== this.appliedClosedBy)
    ) {
      Object.assign(dialog, { closedBy });
      this.appliedClosedBy = closedBy;
    }

    const title = context.titleHost();
    const description = context.descriptionHost();
    if (
      dialog !== this.appliedDialog ||
      title !== this.appliedTitle ||
      description !== this.appliedDescription
    ) {
      this.appliedDialog = dialog;
      this.appliedTitle = title;
      this.appliedDescription = description;
      applyDialogAria(dialog, context);
    }
  }

  private attachDocumentListeners(): void {
    if (Build.isServer) {
      return;
    }
    const context = this.dialogContext;
    if (context === undefined) {
      return;
    }

    const nativeModalDismiss =
      context.modal() && this.dialogEl !== undefined && "closedBy" in this.dialogEl;
    if (!nativeModalDismiss) {
      this.pointerHandler = (event: PointerEvent) => {
        const dialog = this.dialogEl;
        if (!dialog || !dialog.open || !context.closeOnInteractOutside()) {
          return;
        }
        if (!event.composedPath().includes(dialog)) {
          this.closeDialog("");
        }
      };
      document.addEventListener("pointerdown", this.pointerHandler, true);
    }

    if (context.modal()) {
      // Modal dialogs handle Escape natively via the cancel event.
    } else {
      this.keyHandler = (event: KeyboardEvent) => {
        if (this.dialogEl?.open && event.key === "Escape" && context.closeOnEscape()) {
          this.closeDialog("");
        }
      };
      document.addEventListener("keydown", this.keyHandler, true);
    }
  }

  private detachDocumentListeners(): void {
    if (this.pointerHandler !== undefined) {
      document.removeEventListener("pointerdown", this.pointerHandler, true);
      this.pointerHandler = undefined;
    }
    if (this.keyHandler !== undefined) {
      document.removeEventListener("keydown", this.keyHandler, true);
      this.keyHandler = undefined;
    }
  }

  render(): VNode {
    return (
      <Host class={styles.host}>
        <dialog
          ref={(el) => {
            this.dialogEl = el;
          }}
          class={styles.dialog}
          part="dialog"
          role={this.dialogRole}
          aria-label={this.dialogLabel === "" ? undefined : this.dialogLabel}
          onClose={() => {
            // Reopening can queue a close event after the dialog is already open again.
            if (this.dialogEl?.open) {
              return;
            }
            const returnValue = this.dialogEl?.returnValue ?? "";
            this.dialogContext?.notifyOpen(false, returnValue);
          }}
          onCancel={(event) => {
            if (this.dialogContext?.closeOnEscape() === false) {
              event.preventDefault();
            } else {
              this.dialogContext?.notifyCancel();
            }
          }}
        >
          <div class={styles.surface} part="content">
            <slot />
          </div>
        </dialog>
      </Host>
    );
  }
}

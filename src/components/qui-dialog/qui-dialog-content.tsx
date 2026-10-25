import {
  Build,
  resolveVar,
  Component,
  Element,
  h,
  Host,
  Prop,
  State,
  type VNode,
} from "@stencil/core";

import { styleUrls } from "#qui-style-url";
import { css, cx } from "#styled-system/css";

import { isHTMLDialogElement } from "../../helpers/dom";
import { consumeContextPart } from "../shared/context-part";
import { consumeDialog, type DialogContext, type DialogControl } from "./context";

const styles = {
  host: css({ display: "contents" }),
  dialog: css({
    margin: "auto",
    padding: 0,
    borderWidth: 0,
    backgroundColor: "transparent",
    maxWidth: "none",
    maxHeight: "none",
    color: "onSurface",
    outlineStyle: "none",
    // Keeps the surface shadow from being clipped; the surface scrolls itself.
    overflow: "visible",
    "&::backdrop": {
      backgroundColor: "scrim",
      opacity: 0.32,
    },
    "&:focus-visible": {
      outlineStyle: "none",
    },
  }),
  surface: css({
    display: "flex",
    flexDirection: "column",
    gap: "4",
    width: "full",
    minWidth: "72",
    maxWidth: "xl",
    maxHeight: "calc(100dvh - 2rem)",
    overflowY: "auto",
    padding: "6",
    rounded: "3xl",
    backgroundColor: "surfaceContainerHigh",
    boxShadow: "xl",
    color: "onSurface",
  }),
};

/**
 * The native `<dialog>` surface for `qui-dialog`.
 *
 * @slot - Dialog title, description, body, and actions.
 */
@Component({
  tag: "qui-dialog-content",
  styleUrl: resolveVar(styleUrls.quiDialogContent),
  scoped: true,
})
export class QuiDialogContent {
  @Element() host!: HTMLQuiDialogContentElement;

  /** Additional class applied to the content surface. */
  @Prop() innerClass?: string;

  @State() private dialogRole: "dialog" | "alertdialog" = "dialog";
  @State() private dialogLabel?: string;

  private readonly contextPart = consumeContextPart({
    host: (): HTMLElement => this.host,
    key: "dialog",
    consume: consumeDialog,
    subscribe: false,
    setup: () => {
      this.registerControl();
      return (): void => {
        this.detachDocumentListeners();
        this.unregister?.();
        this.unregister = undefined;
      };
    },
  });

  private unregister?: () => void;
  private dialogEl?: HTMLDialogElement;
  private pointerHandler?: (event: PointerEvent) => void;
  private keyHandler?: (event: KeyboardEvent) => void;

  private get dialogContext(): DialogContext | undefined {
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
    // The native <dialog> ref does not exist during componentWillLoad.
    // The first registration therefore waits until after the initial render.
    this.registerControl();
    this.applyDialogAttributes();
  }

  public componentDidRender(): void {
    this.applyDialogAttributes();
  }

  public disconnectedCallback(): void {
    this.contextPart.hostDisconnected();
  }

  private registerControl(): void {
    const context = this.dialogContext;
    if (context === undefined || this.unregister !== undefined || this.dialogEl === undefined) {
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
      setClosedBy: (value) => {
        if (this.dialogEl !== undefined && "closedBy" in this.dialogEl) {
          Object.assign(this.dialogEl, { closedBy: value });
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
    if (dialog === undefined || dialog.open) {
      return;
    }
    if (modal) {
      dialog.showModal();
    } else {
      dialog.show();
    }
    this.dialogContext?.notifyOpen(true, "");
  }

  private closeDialog(returnValue = ""): void {
    this.dialogEl?.close(returnValue);
  }

  private applyDialogAttributes(): void {
    const dialog = this.dialogEl;
    if (dialog === undefined || this.dialogContext === undefined) {
      return;
    }
    if ("closedBy" in dialog) {
      Object.assign(dialog, {
        closedBy: this.dialogContext.closeOnInteractOutside() ? "any" : "closerequest",
      });
    }

    const { ids } = this.dialogContext;
    if (dialog.querySelector("[part=title]")) {
      dialog.setAttribute("aria-labelledby", ids.title);
    } else {
      dialog.removeAttribute("aria-labelledby");
    }
    if (dialog.querySelector("[part=description]")) {
      dialog.setAttribute("aria-describedby", ids.description);
    } else {
      dialog.removeAttribute("aria-describedby");
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
      this.pointerHandler = (event: PointerEvent): void => {
        const dialog = this.dialogEl;
        if (dialog === undefined || !dialog.open || !context.closeOnInteractOutside()) {
          return;
        }
        const { target } = event;
        if (target instanceof Node && !dialog.contains(target)) {
          this.closeDialog("");
        }
      };
      document.addEventListener("pointerdown", this.pointerHandler, true);
    }

    if (context.modal()) {
      // Modal dialogs handle Escape natively via the cancel event.
    } else {
      this.keyHandler = (event: KeyboardEvent): void => {
        if (this.dialogEl?.open === true && event.key === "Escape" && context.closeOnEscape()) {
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

  public render(): VNode {
    return (
      <Host class={styles.host}>
        <dialog
          ref={(el) => {
            if (isHTMLDialogElement(el)) {
              this.dialogEl = el;
            }
          }}
          class={styles.dialog}
          part="dialog"
          role={this.dialogRole}
          aria-label={
            this.dialogLabel === undefined || this.dialogLabel === "" ? undefined : this.dialogLabel
          }
          onClose={() => {
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
          <div class={cx(styles.surface, this.innerClass)} part="content">
            <slot />
          </div>
        </dialog>
      </Host>
    );
  }
}

import {
  Build,
  resolveVar,
  Component,
  Element,
  Event,
  h,
  Host,
  Method,
  Prop,
  Watch,
  type EventEmitter,
  type VNode,
} from "@stencil/core";

import { styleUrls } from "#qui-style-url";
import { css } from "#styled-system/css";

import { nextId } from "../../helpers/id";
import {
  clearDialog,
  provideDialog,
  type DialogContext,
  type DialogControl,
  type DialogIds,
} from "./context";

const styles = {
  host: css({ display: "contents" }),
};

/**
 * MD3 dialog backed by the native `<dialog>` element. Compose with
 * `qui-dialog-trigger`, `qui-dialog-content`, `qui-dialog-title`,
 * `qui-dialog-description`, `qui-dialog-actions`, and `qui-dialog-close`.
 *
 * @slot - Dialog trigger and content.
 */
@Component({
  tag: "qui-dialog",
  styleUrl: resolveVar(styleUrls.quiDialog),
  scoped: true,
})
export class QuiDialog {
  @Element() host!: HTMLQuiDialogElement;

  /** The controlled open state. */
  @Prop() open?: boolean;
  /** The initial open state. */
  @Prop() defaultOpen = false;
  /** Uses modal behavior (`showModal`) instead of non-modal (`show`). */
  @Prop() modal?: boolean;
  /** Whether Escape closes the dialog. */
  @Prop() closeOnEscape?: boolean;
  /** Whether clicking outside closes the dialog. */
  @Prop() closeOnInteractOutside?: boolean;
  /** Whether page scrolling is prevented while a modal dialog is open. */
  @Prop() preventScroll?: boolean;
  /** The dialog ARIA role. */
  @Prop() dialogRole: "dialog" | "alertdialog" = "dialog";
  /** Accessible label when no title is rendered. */
  @Prop() dialogLabel?: string;

  /** Emitted whenever the open state changes. */
  @Event({ eventName: "openchange", bubbles: true, composed: true })
  openChange!: EventEmitter<{ open: boolean; returnValue: string }>;

  /** Emitted when the native dialog fires `cancel`. */
  @Event({ eventName: "dialogcancel", bubbles: true, composed: true })
  dialogCancel!: EventEmitter<void>;

  private isOpen = false;
  private currentReturnValue = "";

  private control?: DialogControl;
  private readonly listeners = new Set<() => void>();
  private locked = false;
  private readonly baseId = nextId("qui-dialog");
  private readonly ids: DialogIds = {
    title: `${this.baseId}::title`,
    description: `${this.baseId}::description`,
  };

  public componentWillLoad(): void {
    provideDialog(this.host, this.context());
  }

  public connectedCallback(): void {
    provideDialog(this.host, this.context());
  }

  public disconnectedCallback(): void {
    clearDialog(this.host);
    this.unlockScroll();
    this.listeners.clear();
  }

  @Watch("open")
  private onOpenPropChange(): void {
    if (this.open === true) {
      this.requestOpen();
    } else if (this.open === false) {
      this.requestClose();
    }
  }

  @Watch("closeOnInteractOutside")
  @Watch("dialogRole")
  @Watch("dialogLabel")
  private syncControl(): void {
    this.applyControlSettings();
  }

  /** Opens the dialog. */
  @Method()
  public async show(): Promise<void> {
    await Promise.resolve();
    this.requestOpen();
  }

  /** Closes the dialog. */
  @Method()
  public async close(returnValue = ""): Promise<void> {
    await Promise.resolve();
    this.requestClose(returnValue);
  }

  /** Whether the dialog is currently open. */
  @Method()
  public async isDialogOpen(): Promise<boolean> {
    await Promise.resolve();
    return this.isOpen;
  }

  private isModal(): boolean {
    return this.modal !== false;
  }

  private allowsEscape(): boolean {
    return this.closeOnEscape !== false;
  }

  private allowsInteractOutside(): boolean {
    return this.closeOnInteractOutside !== false;
  }

  private context(): DialogContext {
    return {
      ids: this.ids,
      open: () => this.isOpen,
      modal: () => this.isModal(),
      closeOnEscape: () => this.allowsEscape(),
      closeOnInteractOutside: () => this.allowsInteractOutside(),
      requestOpen: () => {
        this.requestOpen();
      },
      requestClose: (returnValue) => {
        this.requestClose(returnValue);
      },
      notifyOpen: (open, returnValue) => {
        this.notifyOpen(open, returnValue);
      },
      notifyCancel: () => {
        this.notifyCancel();
      },
      register: (control) => {
        this.control = control;
        this.applyControlSettings();
        if (this.open === true || (this.open === undefined && this.defaultOpen)) {
          control.show(this.isModal());
        }
        return () => {
          if (this.control === control) {
            this.control = undefined;
          }
        };
      },
      subscribe: (listener) => {
        this.listeners.add(listener);
        return () => {
          this.listeners.delete(listener);
        };
      },
    };
  }

  private requestOpen(): void {
    if (this.control !== undefined) {
      this.control.show(this.isModal());
      return;
    }
    this.setOpenState(true, "");
  }

  private requestClose(returnValue = ""): void {
    this.control?.close(returnValue);
    this.setOpenState(false, returnValue);
  }

  /** Called by the content component when the native dialog opens or closes. */
  private notifyOpen(open: boolean, returnValue: string): void {
    this.setOpenState(open, returnValue);
  }

  /** Called by the content component when the native cancel event fires. */
  private notifyCancel(): void {
    this.dialogCancel.emit();
  }

  private setOpenState(open: boolean, returnValue: string): void {
    const changed = this.isOpen !== open || this.currentReturnValue !== returnValue;
    this.isOpen = open;
    this.currentReturnValue = returnValue;
    if (open) {
      this.lockScroll();
    } else {
      this.unlockScroll();
    }
    if (changed) {
      this.openChange.emit({ open, returnValue });
      for (const listener of this.listeners) {
        listener();
      }
    }
  }

  private applyControlSettings(): void {
    if (this.control === undefined) {
      return;
    }
    this.control.setRole(this.dialogRole);
    this.control.setLabel(this.dialogLabel);
    this.control.setClosedBy(this.allowsInteractOutside() ? "any" : "closerequest");
  }

  private lockScroll(): void {
    if (Build.isServer || !this.isModal() || this.preventScroll === false || this.locked) {
      return;
    }
    this.locked = true;
    document.documentElement.dataset.quiScrollLocked = "";
  }

  private unlockScroll(): void {
    if (Build.isServer || !this.locked) {
      return;
    }
    this.locked = false;
    delete document.documentElement.dataset.quiScrollLocked;
  }

  public render(): VNode {
    return (
      <Host class={styles.host}>
        <slot />
      </Host>
    );
  }
}

import { createContextStore } from "../shared/context-store";
import { type DialogHostRegistration } from "./dialog-aria";

export interface DialogIds {
  title: string;
  description: string;
}

/** Imperative control registered by the component that owns the native dialog. */
export interface DialogControl {
  show: (modal: boolean) => void;
  close: (returnValue?: string) => void;
  isOpen: () => boolean;
  setModal: (modal: boolean) => void;
  setClosedBy: (value: "any" | "closerequest" | "none") => void;
  setRole: (role: "dialog" | "alertdialog") => void;
  setLabel: (label: string | undefined) => void;
}

export interface DialogContext extends DialogHostRegistration {
  ids: DialogIds;
  open: () => boolean;
  modal: () => boolean;
  closeOnEscape: () => boolean;
  closeOnInteractOutside: () => boolean;
  requestOpen: () => void;
  requestClose: (returnValue?: string) => void;
  notifyOpen: (open: boolean, returnValue: string) => void;
  notifyCancel: () => void;
  register: (control: DialogControl) => () => void;
  subscribe: (listener: () => void) => () => void;
}

// oxlint-disable-next-line stencil/ban-side-effects -- Allocating a context map has no side effects.
const dialogs = createContextStore<DialogContext>("dialog");

function provideDialog(host: HTMLElement, context: DialogContext): void {
  dialogs.provide(host, context);
}

function clearDialog(host: HTMLElement): void {
  dialogs.clear(host);
}

function consumeDialog(host: HTMLElement): DialogContext | undefined {
  return dialogs.consume(host);
}

export { clearDialog, consumeDialog, provideDialog };

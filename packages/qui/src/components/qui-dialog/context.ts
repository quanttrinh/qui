import { createContextStore } from "../shared/context";
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

export const dialogContext = createContextStore<DialogContext>();

const { provide: provideDialog, clear: clearDialog, consume: consumeDialog } = dialogContext;

export { clearDialog, consumeDialog, provideDialog };

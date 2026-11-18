import type { DialogHostRegistration } from "./dialog-aria";

import type { ContextProviderHandle } from "../shared/context";

import { clearContext, createContext, provideContext } from "../shared/context";

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
}

export const dialogContext = createContext<DialogContext>();

export const provideDialog = (
  host: Element,
  context: DialogContext,
): ContextProviderHandle<DialogContext> => provideContext(host, dialogContext, context);

export const clearDialog = (host: Element): void => {
  clearContext(host, dialogContext);
};

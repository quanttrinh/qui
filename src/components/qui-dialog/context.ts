export interface DialogIds {
  title: string;
  description: string;
}

/** Imperative control registered by the component that owns the native dialog. */
export interface DialogControl {
  show: (modal: boolean) => void;
  close: (returnValue?: string) => void;
  isOpen: () => boolean;
  setClosedBy: (value: "any" | "closerequest" | "none") => void;
  setRole: (role: "dialog" | "alertdialog") => void;
  setLabel: (label: string | undefined) => void;
}

export interface DialogContext {
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

const dialogs = new WeakMap<HTMLElement, DialogContext>();

function provideDialog(host: HTMLElement, context: DialogContext): void {
  dialogs.set(host, context);
}

function clearDialog(host: HTMLElement): void {
  dialogs.delete(host);
}

function consumeDialog(host: HTMLElement): DialogContext | undefined {
  let node: Element | undefined = host.parentElement ?? undefined;
  while (node !== undefined) {
    if (node instanceof HTMLElement) {
      const context = dialogs.get(node);
      if (context !== undefined) {
        return context;
      }
    }
    node = node.parentElement ?? undefined;
  }
  return undefined;
}

export { clearDialog, consumeDialog, provideDialog };

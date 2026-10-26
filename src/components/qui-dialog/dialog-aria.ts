import { setAriaDescribedBy, setAriaLabelledBy } from "../shared/aria";

/** Lazily resolves the mounted dialog title and description host elements. */
export interface DialogHostRefs {
  titleHost: () => HTMLElement | undefined;
  descriptionHost: () => HTMLElement | undefined;
}

/** Registers the mounted title and description hosts for dialog ARIA wiring. */
export interface DialogHostRegistration extends DialogHostRefs {
  /** Register a mounted title host. Returns an unregister function. */
  registerTitle: (host: HTMLElement) => () => void;
  /** Register a mounted description host. Returns an unregister function. */
  registerDescription: (host: HTMLElement) => () => void;
}

/** Tracks the mounted title and description hosts for dialog ARIA wiring. */
export interface DialogHostRegistry extends DialogHostRegistration {
  /** Forget both hosts, for example when the dialog disconnects. */
  clear: () => void;
}

/**
 * Creates the host registry shared by the dialog provider and its content.
 * `onChange` fires whenever the registered title or description changes.
 */
function createDialogHostRegistry(onChange: () => void): DialogHostRegistry {
  let titleHost: HTMLElement | undefined = undefined;
  let descriptionHost: HTMLElement | undefined = undefined;

  const registerTitle = (host: HTMLElement): (() => void) => {
    if (titleHost !== host) {
      titleHost = host;
      onChange();
    }
    return (): void => {
      // Ignore stale unregisters after a newer title replaced this one.
      if (titleHost === host) {
        titleHost = undefined;
        onChange();
      }
    };
  };

  const registerDescription = (host: HTMLElement): (() => void) => {
    if (descriptionHost !== host) {
      descriptionHost = host;
      onChange();
    }
    return (): void => {
      if (descriptionHost === host) {
        descriptionHost = undefined;
        onChange();
      }
    };
  };

  const clear = (): void => {
    if (titleHost === undefined && descriptionHost === undefined) {
      return;
    }
    titleHost = undefined;
    descriptionHost = undefined;
    onChange();
  };

  return {
    clear,
    descriptionHost: () => descriptionHost,
    registerDescription,
    registerTitle,
    titleHost: () => titleHost,
  };
}

/**
 * Points the native dialog's name and description at the registered hosts.
 * Passing empty targets clears the relationship when a part is absent.
 */
function applyDialogAria(dialog: HTMLElement, refs: DialogHostRefs): void {
  const title = refs.titleHost();
  setAriaLabelledBy(dialog, title === undefined ? [] : [title]);
  const description = refs.descriptionHost();
  setAriaDescribedBy(dialog, description === undefined ? [] : [description]);
}

export { applyDialogAria, createDialogHostRegistry };

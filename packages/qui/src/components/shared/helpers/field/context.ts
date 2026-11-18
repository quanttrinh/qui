import type { FieldControlHandle } from "./registry";

import type { ContextProviderHandle } from "../../context";

import { clearContext, createContext, provideContext } from "../../context";

/** Resolved ids for the parts of a field. */
export interface FieldIds {
  root: string;
  control: string;
  label: string;
  errorText: string;
  helperText: string;
}

/** Props applied to the control that a field owns. */
export interface FieldControlProps {
  id: string;
  disabled: boolean;
  required: boolean;
  readOnly?: boolean;
  "aria-invalid"?: "true";
  "data-scope": "field";
  "data-part": "input";
  "data-invalid"?: "";
  "data-required"?: "";
  "data-readonly"?: "";
}

interface FieldLabelProps {
  id: string;
  htmlFor: string;
  "data-scope": "field";
  "data-part": "label";
  "data-disabled"?: "";
  "data-invalid"?: "";
  "data-readonly"?: "";
  "data-required"?: "";
}

interface FieldTextProps {
  id: string;
  "data-scope": "field";
  "data-part": "helper-text" | "error-text";
  "data-disabled"?: "";
  "aria-live"?: "polite";
}

/**
 * The field API shared with descendant controls. A field owns the ids and the
 * disabled/invalid/required state; controls read it instead of duplicating it.
 */
export interface FieldApi {
  ids: FieldIds;
  invalid: () => boolean;
  disabled: () => boolean;
  readOnly: () => boolean;
  required: () => boolean;
  getInputProps: () => FieldControlProps;
  getLabelProps: () => FieldLabelProps;
  getHelperTextProps: () => FieldTextProps;
  getErrorTextProps: () => FieldTextProps;
  /** The mounted label host, used for host-targeted `aria-labelledby`. */
  getLabelHost: () => HTMLElement | undefined;
  /** The mounted helper-text hosts, in registration order. */
  getHelperTextHosts: () => readonly HTMLElement[];
  /** The mounted error-text hosts, in registration order. */
  getErrorTextHosts: () => readonly HTMLElement[];
  /** Register a mounted label part. Returns an unregister function. */
  registerLabel: (host: HTMLElement) => () => void;
  /** Register a mounted helper-text part. Returns an unregister function. */
  registerHelperText: (host: HTMLElement) => () => void;
  /** Register a mounted error-text part. Returns an unregister function. */
  registerErrorText: (host: HTMLElement) => () => void;
  /** Register the control's internal focusable handle. Returns an unregister function. */
  registerControl: (control: FieldControlHandle) => () => void;
  /** Focus the registered control, if any. */
  focusControl: (options?: FocusOptions) => void;
  /** Click the registered control, if any. */
  clickControl: () => void;
}

export const fieldContext = createContext<FieldApi>();

export const provideField = (host: Element, field: FieldApi): ContextProviderHandle<FieldApi> =>
  provideContext(host, fieldContext, field);

export const clearField = (host: Element): void => {
  clearContext(host, fieldContext);
};

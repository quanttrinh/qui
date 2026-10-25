import { notifyContextProvided } from "../context-part";

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
  "aria-describedby"?: string;
  "aria-errormessage"?: string;
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
  /** Register a mounted helper-text part. Returns an unregister function. */
  registerHelperText: () => () => void;
  /** Register a mounted error-text part. Returns an unregister function. */
  registerErrorText: () => () => void;
  /** Subscribe to field state changes. Returns an unsubscribe function. */
  subscribe: (listener: () => void) => () => void;
}

const fields = new WeakMap<HTMLElement, FieldApi>();

/** Attach a field API to its host element. */
function provideField(host: HTMLElement, field: FieldApi): void {
  fields.set(host, field);
  notifyContextProvided("field");
}

/** Remove the field API from a host element. */
function clearField(host: HTMLElement): void {
  fields.delete(host);
  notifyContextProvided("field");
}

function parentElement(node: Element): Element | undefined {
  const parent = node.parentElement;
  if (parent) {
    return parent;
  }
  const root = node.getRootNode();
  return root instanceof ShadowRoot ? root.host : undefined;
}

/** Find the closest ancestor field, crossing shadow boundaries. */
function consumeField(host: HTMLElement): FieldApi | undefined {
  let node = parentElement(host);
  while (node !== undefined) {
    if (node instanceof HTMLElement) {
      const field = fields.get(node);
      if (field !== undefined) {
        return field;
      }
    }
    node = parentElement(node);
  }
  return undefined;
}

export { clearField, consumeField, provideField };

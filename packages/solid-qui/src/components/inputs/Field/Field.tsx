import {
  type Accessor,
  type JSX,
  Show,
  createSignal,
  createUniqueId,
  onCleanup,
  onMount,
  splitProps,
  untrack,
} from "solid-js";

import { css, cx } from "../../../../styled-system/css";
import { stack } from "../../../../styled-system/patterns";
import { ariaAttr, dataAttr } from "../../../utilities/attr";
import { useContext } from "../../../utilities/context";
import { FieldContext } from "./useFieldContext";

const FIELD_SCOPE = "field" as const;
type FieldScope = typeof FIELD_SCOPE;

const styles = {
  root: stack({ gap: "1.5", _disabled: { cursor: "not-allowed" } }),
  label: css({
    fontSize: "sm",
    fontWeight: "medium",
    color: "onSurface",
    _disabled: { opacity: 0.38 },
  }),
  helperText: css({
    fontSize: "xs",
    color: "onSurfaceVariant",
  }),
  errorText: css({
    fontSize: "xs",
    color: "error",
  }),
  requiredIndicator: css({
    color: "error",
    marginInlineStart: "0.5",
  }),
};

interface FieldElementIds {
  root: string;
  control: string;
  label: string;
  errorText: string;
  helperText: string;
}

interface FieldProps {
  id?: string;
  ids?: Partial<FieldElementIds>;
  invalid?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  class?: string;
  children?: JSX.Element;
}

interface FieldRootAttributes {
  id: string;
  role: "group";
  "data-scope": FieldScope;
  "data-part": "root";
  "data-disabled"?: "";
  "data-invalid"?: "";
  "data-readonly"?: "";
}

interface FieldLabelAttributes {
  id: string;
  htmlFor: string;
  "data-scope": FieldScope;
  "data-part": "label";
  "data-disabled"?: "";
  "data-invalid"?: "";
  "data-readonly"?: "";
  "data-required"?: "";
}

interface FieldControlProps {
  id: string;
  disabled: boolean;
  required: boolean;
  readOnly?: boolean;
  "aria-invalid"?: "true";
  "aria-describedby"?: string;
  "aria-errormessage"?: string;
  "data-scope": FieldScope;
  "data-part": "input";
  "data-invalid"?: "";
  "data-required"?: "";
  "data-readonly"?: "";
}

interface FieldHelperTextAttributes {
  id: string;
  "data-scope": FieldScope;
  "data-part": "helper-text";
  "data-disabled"?: "";
}

interface FieldErrorTextAttributes {
  id: string;
  "data-scope": FieldScope;
  "data-part": "error-text";
  "aria-live": "polite";
}

interface FieldRequiredIndicatorAttributes {
  "data-scope": FieldScope;
  "data-part": "required-indicator";
  "aria-hidden": true;
}

interface FieldApi {
  /** The resolved ids of the field parts. */
  ids: FieldElementIds;
  /** Whether the field is invalid. */
  invalid: Accessor<boolean>;
  /** Whether the field is disabled. */
  disabled: Accessor<boolean>;
  /** Whether the field is read-only. */
  readOnly: Accessor<boolean>;
  /** Whether the field is required. */
  required: Accessor<boolean>;
  /** Whether a helper text part is currently mounted. */
  hasHelperText: Accessor<boolean>;
  /** Whether an error text part is currently mounted. */
  hasErrorText: Accessor<boolean>;
  /** Registers a mounted helper text part. Returns an unregister function. */
  registerHelperText: () => () => void;
  /** Registers a mounted error text part. Returns an unregister function. */
  registerErrorText: () => () => void;
  getRootProps: () => FieldRootAttributes;
  getLabelProps: () => FieldLabelAttributes;
  getInputProps: () => FieldControlProps;
  getHelperTextProps: () => FieldHelperTextAttributes;
  getErrorTextProps: () => FieldErrorTextAttributes;
  getRequiredIndicatorProps: () => FieldRequiredIndicatorAttributes;
}

interface FieldPartProps {
  class?: string;
  children?: JSX.Element;
}

function getRequiredIndicatorProps(): FieldRequiredIndicatorAttributes {
  return {
    "data-scope": FIELD_SCOPE,
    "data-part": "required-indicator",
    "aria-hidden": true,
  };
}

function FieldRoot(props: FieldProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    "id",
    "ids",
    "invalid",
    "disabled",
    "readOnly",
    "required",
    "class",
    "children",
  ]);

  const id = untrack(() => local.id) ?? createUniqueId();
  const ids: FieldElementIds = untrack(() => ({
    root: local.ids?.root ?? `${FIELD_SCOPE}::${id}`,
    control: local.ids?.control ?? `${FIELD_SCOPE}::${id}::control`,
    label: local.ids?.label ?? `${FIELD_SCOPE}::${id}::label`,
    errorText: local.ids?.errorText ?? `${FIELD_SCOPE}::${id}::error-text`,
    helperText: local.ids?.helperText ?? `${FIELD_SCOPE}::${id}::helper-text`,
  }));

  const invalid = (): boolean => local.invalid ?? false;
  const disabled = (): boolean => local.disabled ?? false;
  const readOnly = (): boolean => local.readOnly ?? false;
  const required = (): boolean => local.required ?? false;

  const [helperTextCount, setHelperTextCount] = createSignal(0);
  const [errorTextCount, setErrorTextCount] = createSignal(0);
  const hasHelperText = (): boolean => helperTextCount() > 0;
  const hasErrorText = (): boolean => errorTextCount() > 0;

  const registerHelperText = (): (() => void) => {
    setHelperTextCount((count): number => count + 1);
    return () => setHelperTextCount((count): number => count - 1);
  };
  const registerErrorText = (): (() => void) => {
    setErrorTextCount((count): number => count + 1);
    return () => setErrorTextCount((count): number => count - 1);
  };

  const getRootProps = (): FieldRootAttributes => ({
    id: ids.root,
    role: "group",
    "data-scope": FIELD_SCOPE,
    "data-part": "root",
    "data-disabled": dataAttr(disabled()),
    "data-invalid": dataAttr(invalid()),
    "data-readonly": dataAttr(readOnly()),
  });

  const getLabelProps = (): FieldLabelAttributes => ({
    id: ids.label,
    htmlFor: ids.control,
    "data-scope": FIELD_SCOPE,
    "data-part": "label",
    "data-disabled": dataAttr(disabled()),
    "data-invalid": dataAttr(invalid()),
    "data-readonly": dataAttr(readOnly()),
    "data-required": dataAttr(required()),
  });

  const getInputProps = (): FieldControlProps => ({
    id: ids.control,
    disabled: disabled(),
    required: required(),
    readOnly: readOnly() || undefined,
    "data-scope": FIELD_SCOPE,
    "data-part": "input",
    "aria-invalid": ariaAttr(invalid()),
    "aria-describedby": hasHelperText() ? ids.helperText : undefined,
    "aria-errormessage": hasErrorText() ? ids.errorText : undefined,
    "data-invalid": dataAttr(invalid()),
    "data-required": dataAttr(required()),
    "data-readonly": dataAttr(readOnly()),
  });

  const getHelperTextProps = (): FieldHelperTextAttributes => ({
    id: ids.helperText,
    "data-scope": FIELD_SCOPE,
    "data-part": "helper-text",
    "data-disabled": dataAttr(disabled()),
  });

  const getErrorTextProps = (): FieldErrorTextAttributes => ({
    id: ids.errorText,
    "data-scope": FIELD_SCOPE,
    "data-part": "error-text",
    "aria-live": "polite",
  });

  const field: FieldApi = {
    ids,
    invalid,
    disabled,
    readOnly,
    required,
    hasHelperText,
    hasErrorText,
    registerHelperText,
    registerErrorText,
    getRootProps,
    getLabelProps,
    getInputProps,
    getHelperTextProps,
    getErrorTextProps,
    getRequiredIndicatorProps,
  };

  return (
    <FieldContext.Provider value={{ field }}>
      <div {...field.getRootProps()} class={cx(styles.root, local.class)} {...rest}>
        {local.children}
      </div>
    </FieldContext.Provider>
  );
}

function FieldLabel(props: FieldPartProps): JSX.Element {
  const { field } = useContext(FieldContext, "Field.Label", FIELD_SCOPE);
  const [local] = splitProps(props, ["class", "children"]);

  return (
    <label {...field.getLabelProps()} class={cx(styles.label, local.class)}>
      {local.children}
    </label>
  );
}

function FieldHelperText(props: FieldPartProps): JSX.Element {
  const { field } = useContext(FieldContext, "Field.HelperText", FIELD_SCOPE);
  const [local] = splitProps(props, ["class", "children"]);

  onMount(() => onCleanup(field.registerHelperText()));

  return (
    <span {...field.getHelperTextProps()} class={cx(styles.helperText, local.class)}>
      {local.children}
    </span>
  );
}

function FieldErrorText(props: FieldPartProps): JSX.Element {
  const { field } = useContext(FieldContext, "Field.ErrorText", FIELD_SCOPE);
  const [local] = splitProps(props, ["class", "children"]);

  onMount(() => onCleanup(field.registerErrorText()));

  return (
    <Show when={field.invalid()}>
      <span {...field.getErrorTextProps()} class={cx(styles.errorText, local.class)}>
        {local.children}
      </span>
    </Show>
  );
}

function FieldRequiredIndicator(props: FieldPartProps): JSX.Element {
  const { field } = useContext(FieldContext, "Field.RequiredIndicator", FIELD_SCOPE);
  const [local] = splitProps(props, ["class", "children"]);

  return (
    <Show when={field.required()}>
      <span
        {...field.getRequiredIndicatorProps()}
        class={cx(styles.requiredIndicator, local.class)}
      >
        {local.children ?? "*"}
      </span>
    </Show>
  );
}

const Field = Object.assign(FieldRoot, {
  Label: FieldLabel,
  HelperText: FieldHelperText,
  ErrorText: FieldErrorText,
  RequiredIndicator: FieldRequiredIndicator,
});

export { Field };
export type { FieldApi };

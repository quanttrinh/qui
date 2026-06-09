import { Field as ArkField } from "@ark-ui/solid/field";
import { type JSX, splitProps } from "solid-js";

import { cn } from "../../cn";

interface FieldRootProps {
  invalid?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  class?: string;
  children?: JSX.Element;
}

function FieldRoot(props: Readonly<FieldRootProps>): JSX.Element {
  const [local, rest] = splitProps(props, [
    "invalid",
    "disabled",
    "readOnly",
    "required",
    "class",
    "children",
  ]);

  return (
    <ArkField.Root
      invalid={local.invalid}
      disabled={local.disabled}
      readOnly={local.readOnly}
      required={local.required}
      class={cn("flex flex-col gap-1.5", local.class)}
      {...rest}
    >
      {local.children}
    </ArkField.Root>
  );
}

function FieldLabel(props: Readonly<{ class?: string; children?: JSX.Element }>): JSX.Element {
  return (
    <ArkField.Label class={cn("text-sm font-medium text-md3-on-surface", props.class)}>
      {props.children}
    </ArkField.Label>
  );
}

function FieldHelperText(props: Readonly<{ class?: string; children?: JSX.Element }>): JSX.Element {
  return (
    <ArkField.HelperText class={cn("text-xs text-md3-on-surface-variant", props.class)}>
      {props.children}
    </ArkField.HelperText>
  );
}

function FieldErrorText(props: Readonly<{ class?: string; children?: JSX.Element }>): JSX.Element {
  return (
    <ArkField.ErrorText class={cn("text-xs text-md3-error", props.class)}>
      {props.children}
    </ArkField.ErrorText>
  );
}

FieldRoot.Label = FieldLabel;
FieldRoot.HelperText = FieldHelperText;
FieldRoot.ErrorText = FieldErrorText;

export { FieldRoot as Field, type FieldRootProps };

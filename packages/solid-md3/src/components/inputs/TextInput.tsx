import { Field as ArkField, useFieldContext } from "@ark-ui/solid/field";
import { type VariantProps, cva } from "class-variance-authority";
import { type JSX, Show } from "solid-js";

import { cn } from "../../cn";

const textInputVariants = cva(
  "w-full rounded-md3-sm border border-md3-outline-variant bg-md3-surface-container-lowest text-md3-on-surface transition-colors outline-none placeholder:text-md3-on-surface-variant hover:border-md3-outline focus:border-md3-primary focus:ring-1 focus:ring-md3-primary data-invalid:border-md3-error data-invalid:focus:border-md3-error data-invalid:focus:ring-md3-error",
  {
    defaultVariants: {
      size: "md",
    },
    variants: {
      size: {
        lg: "h-12 px-4 py-2 text-base",
        md: "h-10 px-3 py-1.5 text-sm",
        sm: "h-8 px-2.5 py-1 text-sm",
      },
    },
  },
);

interface TextInputProps extends VariantProps<typeof textInputVariants> {
  value?: string;
  placeholder?: string;
  readOnly?: boolean;
  disabled?: boolean;
  invalid?: boolean;
  name?: string;
  onValueInput?: (event: string) => void;
  onValueChange?: (event: string) => void;
  class?: string;
  required?: boolean;
  label?: string;
  type?: string;
}

export function TextInput(props: Readonly<TextInputProps>): JSX.Element {
  const fieldCtx = useFieldContext();

  return (
    <ArkField.Root
      ids={fieldCtx?.().ids}
      readOnly={props.readOnly ?? fieldCtx?.().readOnly}
      disabled={props.disabled ?? fieldCtx?.().disabled}
      invalid={props.invalid ?? fieldCtx?.().invalid}
      required={props.required ?? fieldCtx?.().required}
      class={cn("inline-flex flex-col gap-2", props.class)}
    >
      <Show when={props.label}>
        <ArkField.Label class="text-sm font-medium text-md3-on-surface">
          {props.label}
        </ArkField.Label>
      </Show>
      <ArkField.Input
        name={props.name}
        value={props.value}
        placeholder={props.placeholder}
        type={props.type}
        onInput={(event) => props.onValueInput?.(event.target.value)}
        onChange={(event) => props.onValueChange?.(event.target.value)}
        class={cn(textInputVariants({ size: props.size }), props.class)}
      />
    </ArkField.Root>
  );
}

export type { TextInputProps };

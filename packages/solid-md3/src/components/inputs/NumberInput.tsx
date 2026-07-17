import { NumberInput as ArkNumberInput } from "@ark-ui/solid/number-input";
import Add from "@iconify-solid/material-symbols/add";
import Remove from "@iconify-solid/material-symbols/remove";
import { type VariantProps, cva } from "class-variance-authority";
import { type JSX, Show, splitProps } from "solid-js";

import { cn } from "../../cn";

const numberInputVariants = cva(
  "flex items-stretch rounded-md3-sm border border-md3-outline-variant bg-md3-surface-container-lowest text-md3-on-surface transition-colors focus-within:border-md3-primary focus-within:ring-1 focus-within:ring-md3-primary hover:border-md3-outline",
  {
    defaultVariants: {
      size: "md",
    },
    variants: {
      size: {
        lg: "h-12",
        md: "h-10",
        sm: "h-8",
      },
    },
  },
);

interface NumberInputProps extends VariantProps<typeof numberInputVariants> {
  value?: string;
  defaultValue?: string;
  readOnly?: boolean;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  invalid?: boolean;
  required?: boolean;
  name?: string;
  onValueChange?: (value: string) => void;
  class?: string;
  placeholder?: string;
  label?: string;
  allowMouseWheel?: boolean;
  formatOptions?: Intl.NumberFormatOptions;
}

export function NumberInput(props: Readonly<NumberInputProps>): JSX.Element {
  const [local, rest] = splitProps(props, [
    "value",
    "defaultValue",
    "readOnly",
    "min",
    "max",
    "step",
    "disabled",
    "invalid",
    "required",
    "name",
    "onValueChange",
    "class",
    "placeholder",
    "label",
    "allowMouseWheel",
    "formatOptions",
    "size",
  ]);

  return (
    <ArkNumberInput.Root
      value={local.value}
      defaultValue={local.defaultValue}
      readOnly={local.readOnly}
      min={local.min}
      max={local.max}
      step={local.step}
      disabled={local.disabled}
      invalid={local.invalid}
      required={local.required}
      name={local.name}
      allowMouseWheel={local.allowMouseWheel}
      formatOptions={local.formatOptions}
      onValueChange={(details) => local.onValueChange?.(details.value)}
      class={cn("inline-flex flex-col gap-2", local.class)}
      {...rest}
    >
      <Show when={local.label}>
        <ArkNumberInput.Label class="text-sm font-medium text-md3-on-surface">
          {local.label}
        </ArkNumberInput.Label>
      </Show>
      <ArkNumberInput.Control class={cn(numberInputVariants({ size: local.size }))}>
        <ArkNumberInput.DecrementTrigger
          class="state-layer flex w-9 items-center justify-center text-md3-on-surface-variant transition-colors disabled:cursor-not-allowed disabled:opacity-38"
          aria-label="Decrement"
        >
          <Remove />
        </ArkNumberInput.DecrementTrigger>
        <ArkNumberInput.Input
          placeholder={local.placeholder}
          class="w-full border-none! bg-transparent! px-2 py-1.5 text-center text-md3-body-md ring-0! outline-none! focus:ring-0!"
        />
        <ArkNumberInput.IncrementTrigger
          class="state-layer flex w-9 items-center justify-center text-md3-on-surface-variant transition-colors disabled:cursor-not-allowed disabled:opacity-38"
          aria-label="Increment"
        >
          <Add />
        </ArkNumberInput.IncrementTrigger>
      </ArkNumberInput.Control>
    </ArkNumberInput.Root>
  );
}

export type { NumberInputProps };

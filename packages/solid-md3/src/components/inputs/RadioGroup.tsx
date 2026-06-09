import { useFieldContext } from "@ark-ui/solid/field";
import { RadioGroup as ArkRadioGroup } from "@ark-ui/solid/radio-group";
import { type JSX, Show, splitProps } from "solid-js";

import { cn } from "../../cn";

interface RadioGroupRootProps {
  value?: string;
  defaultValue?: string;
  orientation?: "horizontal" | "vertical";
  disabled?: boolean;
  invalid?: boolean;
  required?: boolean;
  name?: string;
  onValueChange?: (value: string) => void;
  class?: string;
  children?: JSX.Element;
}

function RadioGroup(props: Readonly<RadioGroupRootProps>): JSX.Element {
  const fieldCtx = useFieldContext();
  const [local, rest] = splitProps(props, [
    "value",
    "defaultValue",
    "orientation",
    "disabled",
    "invalid",
    "required",
    "name",
    "onValueChange",
    "class",
    "children",
  ]);

  return (
    <ArkRadioGroup.Root
      value={local.value}
      defaultValue={local.defaultValue}
      orientation={local.orientation}
      disabled={local.disabled ?? fieldCtx?.().disabled}
      invalid={local.invalid ?? fieldCtx?.().invalid}
      required={local.required ?? fieldCtx?.().required}
      name={local.name}
      onValueChange={(details) => local.onValueChange?.(details.value ?? "")}
      class={cn(
        "flex gap-3",
        local.orientation === "horizontal" ? "flex-row" : "flex-col",
        local.class,
      )}
      {...rest}
    >
      <ArkRadioGroup.Indicator class="absolute h-2.5 w-2.5 translate-x-1.25 translate-y-3.25 rounded-full bg-md3-primary" />
      {local.children}
    </ArkRadioGroup.Root>
  );
}

interface RadioGroupItemProps {
  value: string;
  label?: string;
  description?: string;
  disabled?: boolean;
  invalid?: boolean;
  class?: string;
}

function RadioGroupItem(props: Readonly<RadioGroupItemProps>): JSX.Element {
  const [local, rest] = splitProps(props, [
    "value",
    "label",
    "description",
    "disabled",
    "invalid",
    "class",
  ]);

  return (
    <ArkRadioGroup.Item
      value={local.value}
      disabled={local.disabled}
      invalid={local.invalid}
      class={cn("relative flex items-center gap-2", local.class)}
      {...rest}
    >
      <ArkRadioGroup.ItemControl
        class={cn(
          "inline-flex h-5 w-5 items-center justify-center rounded-full border-2 border-md3-outline transition-colors",
          "data-[state=checked]:border-md3-primary",
          "not-data-disabled:state-layer",
        )}
      />
      <Show when={local.label ?? local.description}>
        <div class="flex flex-col">
          <ArkRadioGroup.ItemText class="cursor-pointer text-sm font-medium text-md3-on-surface">
            {local.label}
          </ArkRadioGroup.ItemText>
          <Show when={local.description}>
            <span class="text-xs text-md3-on-surface-variant">{local.description}</span>
          </Show>
        </div>
      </Show>
      <ArkRadioGroup.ItemHiddenInput class="hidden" />
    </ArkRadioGroup.Item>
  );
}

RadioGroup.Item = RadioGroupItem;

export { RadioGroup, type RadioGroupRootProps as RadioGroupProps };

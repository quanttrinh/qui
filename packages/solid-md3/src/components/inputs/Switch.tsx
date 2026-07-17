import { Switch as ArkSwitch } from "@ark-ui/solid/switch";
import Check from "@iconify-solid/material-symbols/check";
import { type JSX, Show, splitProps } from "solid-js";

import { cn } from "../../cn";

interface SwitchProps {
  label?: string;
  checked?: boolean;
  defaultChecked?: boolean;
  disabled?: boolean;
  invalid?: boolean;
  name?: string;
  value?: string | number;
  onCheckedChange?: (checked: boolean) => void;
  class?: string;
}

export function Switch(props: Readonly<SwitchProps>): JSX.Element {
  const [local, rest] = splitProps(props, [
    "label",
    "checked",
    "defaultChecked",
    "disabled",
    "invalid",
    "name",
    "value",
    "onCheckedChange",
    "class",
  ]);

  return (
    <ArkSwitch.Root
      {...rest}
      checked={local.checked}
      defaultChecked={local.defaultChecked}
      disabled={local.disabled}
      invalid={local.invalid}
      name={local.name}
      value={local.value}
      onCheckedChange={(details) => local.onCheckedChange?.(details.checked)}
      class={cn("relative inline-flex min-h-11 items-center gap-2", local.class)}
    >
      <ArkSwitch.Control
        class={cn(
          "relative inline-flex h-6.5 w-12 shrink-0 items-center overflow-hidden rounded-full border-2 transition-colors",
          "data-[state=checked]:bg-md3-primary data-[state=unchecked]:bg-md3-surface-container-highest",
          "data-[state=checked]:border-md3-primary data-[state=unchecked]:border-md3-outline-variant",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-md3-primary",
        )}
      >
        <ArkSwitch.Thumb
          class={cn(
            "group pointer-events-none absolute flex items-center justify-center rounded-full transition-transform",
            "data-[state=checked]:size-4.5 data-[state=unchecked]:size-3",
            "data-[state=checked]:translate-x-6 data-[state=unchecked]:translate-x-1.5",
            "data-[state=checked]:bg-md3-on-primary data-[state=unchecked]:bg-md3-outline",
          )}
        >
          <ArkSwitch.Context>
            {(api) => (
              <Show when={api().checked}>
                <Check class="text-xl text-md3-on-surface-variant" />
              </Show>
            )}
          </ArkSwitch.Context>
        </ArkSwitch.Thumb>
      </ArkSwitch.Control>
      <Show when={local.label}>
        <ArkSwitch.Label class="cursor-pointer text-sm font-medium text-md3-on-surface">
          {local.label}
        </ArkSwitch.Label>
      </Show>
      <ArkSwitch.HiddenInput class="hidden" />
    </ArkSwitch.Root>
  );
}

export type { SwitchProps };

import { Progress as ArkProgress } from "@ark-ui/solid/progress";
import { type VariantProps, cva } from "class-variance-authority";
import { type JSX, Show, splitProps } from "solid-js";

import { cn } from "../../cn";

const progressVariant = cva("", {
  defaultVariants: {
    size: "md",
  },
  variants: {
    size: {
      lg: "h-2",
      md: "h-1.5",
      sm: "h-1",
    },
  },
});

interface ProgressProps extends VariantProps<typeof progressVariant> {
  value?: number;
  max?: number;
  min?: number;
  onValueChange?: (value: number) => void;
  class?: string;
}

export function Progress(props: Readonly<ProgressProps>): JSX.Element {
  const [local, rest] = splitProps(props, [
    "value",
    "max",
    "min",
    "onValueChange",
    "size",
    "class",
  ]);

  return (
    <ArkProgress.Root
      value={local.value ?? undefined}
      max={local.max}
      min={local.min}
      onValueChange={(details) => local.onValueChange?.(details.value ?? 0)}
      class={cn("flex w-full flex-col gap-1", local.class)}
      {...rest}
    >
      <ArkProgress.Track
        class={cn(
          "overflow-hidden rounded-full bg-md3-surface-container-highest",
          progressVariant({ size: local.size }),
        )}
      >
        <ArkProgress.Range class="h-full rounded-full bg-md3-primary transition-all duration-300" />
      </ArkProgress.Track>
      <Show when={local.value !== undefined}>
        <ArkProgress.ValueText class="text-xs text-md3-on-surface-variant">
          {local.value}%
        </ArkProgress.ValueText>
      </Show>
    </ArkProgress.Root>
  );
}

export type { ProgressProps };

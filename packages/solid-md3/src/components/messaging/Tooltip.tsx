import { Tooltip as ArkTooltip } from "@ark-ui/solid/tooltip";
import { type JSX, splitProps } from "solid-js";
import { Portal } from "solid-js/web";

import { cn } from "../../cn";

interface TooltipProps {
  content: JSX.Element;
  placement?:
    | "top"
    | "bottom"
    | "left"
    | "right"
    | "top-start"
    | "top-end"
    | "bottom-start"
    | "bottom-end";
  openDelay?: number;
  closeDelay?: number;
  disabled?: boolean;
  class?: string;
  children?: JSX.Element;
}

export function Tooltip(props: Readonly<TooltipProps>): JSX.Element {
  const [local, rest] = splitProps(props, [
    "content",
    "placement",
    "openDelay",
    "closeDelay",
    "disabled",
    "class",
    "children",
  ]);

  return (
    <ArkTooltip.Root
      openDelay={local.openDelay ?? 400}
      closeDelay={local.closeDelay ?? 150}
      disabled={local.disabled}
      positioning={{ placement: local.placement ?? "top" }}
      {...rest}
    >
      <ArkTooltip.Trigger>{local.children}</ArkTooltip.Trigger>
      <Portal>
        <ArkTooltip.Positioner>
          <ArkTooltip.Content
            class={cn(
              "rounded-md3-sm bg-md3-surface-container-highest text-md3-on-surface shadow-md3-elevation-2",
              "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in data-[state=closed]:fade-out",
              "z-50 px-2.5 py-1.5 text-xs font-medium",
              local.class,
            )}
          >
            {local.content}
          </ArkTooltip.Content>
        </ArkTooltip.Positioner>
      </Portal>
    </ArkTooltip.Root>
  );
}

export type { TooltipProps };

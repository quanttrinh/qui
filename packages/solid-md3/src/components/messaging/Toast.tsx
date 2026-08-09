import {
  Toast as ArkToast,
  Toaster as ArkToaster,
  type CreateToasterReturn,
  type ToastPlacement,
} from "@ark-ui/solid/toast";
import Close from "@iconify-solid/material-symbols/close";
import { Show, type JSX } from "solid-js";
import { Portal } from "solid-js/web";

import { cn } from "../../cn";

type ToasterProps = {
  toaster: CreateToasterReturn;
};

function Toaster(props: Readonly<ToasterProps>): JSX.Element {
  return (
    <Portal>
      <ArkToaster toaster={props.toaster} class="w-lg max-sm:w-full">
        {(toast) => (
          <ArkToast.Root
            class={cn(
              "flex items-center gap-3 rounded-md3-md p-4 shadow-md3-elevation-3",
              "z-(--z-index) translate-x-(--x) translate-y-(--y) scale-(--scale)",
              "h-(--height) opacity-(--opacity) will-change-[translate,opacity,scale]",
              "transition-[translate,scale,opacity,height,box-shadow] duration-400",
              "ease-[cubic-bezier(0.21,1.02,0.73,1)]",
              "data-[state=closed]:transition-[translate,scale,opacity] data-[state=closed]:duration-200",
              "data-[state=closed]:ease-[cubic-bezier(0.06,0.71,0.55,1)]",
              "data-[type=info]:bg-md3-surface-container-high data-[type=info]:text-md3-on-surface",
              "data-[type=error]:bg-md3-error-container data-[type=error]:text-md3-on-error-container",
              "data-[type=success]:bg-md3-primary-container data-[type=success]:text-md3-on-primary-container",
              "data-[type=warning]:bg-md3-warning-container data-[type=warning]:text-md3-on-warning-container",
              "data-[type=loading]:bg-md3-surface-container-high data-[type=loading]:text-md3-on-surface",
              "w-[calc(100%-var(--gap)*2)]",
            )}
          >
            <div class="min-w-0 flex-1">
              <ArkToast.Title class="text-sm font-medium">{toast().title}</ArkToast.Title>
              <ArkToast.Description class="text-sm opacity-80">
                {toast().description}
              </ArkToast.Description>
              <Show when={toast().action}>
                <ArkToast.ActionTrigger class="text-sm font-medium">
                  {toast().action?.label}
                </ArkToast.ActionTrigger>
              </Show>
            </div>
            <ArkToast.CloseTrigger
              aria-label="Dismiss"
              class="state-layer flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
            >
              <Close class="size-5" />
            </ArkToast.CloseTrigger>
          </ArkToast.Root>
        )}
      </ArkToaster>
    </Portal>
  );
}

export { createToaster } from "@ark-ui/solid/toast";
export { Toaster };
export type { ToasterProps, ToastPlacement, CreateToasterReturn };

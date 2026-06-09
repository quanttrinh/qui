import { Dialog as ArkDialog } from "@ark-ui/solid/dialog";
import Close from "@iconify-solid/material-symbols/close";
import { type VariantProps, cva } from "class-variance-authority";
import { type JSX, Show, splitProps } from "solid-js";
import { Portal } from "solid-js/web";

import { cn } from "../../cn";

const modalVariants = cva("", {
  defaultVariants: {
    width: "sm",
  },
  variants: {
    width: {
      lg: "sm:max-w-4xl",
      md: "sm:max-w-2xl",
      sm: "sm:max-w-md",
      xs: "sm:max-w-xs",
    },
  },
});

type ModalVariants = VariantProps<typeof modalVariants>;

interface ModalProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  width?: ModalVariants["width"];
  children?: JSX.Element;
  class?: string;
  closeOnInteractOutside?: boolean;
}

function ModalRoot(props: Readonly<ModalProps>): JSX.Element {
  const [local, rest] = splitProps(props, [
    "open",
    "defaultOpen",
    "onOpenChange",
    "width",
    "children",
    "class",
    "closeOnInteractOutside",
  ]);

  return (
    <ArkDialog.Root
      {...rest}
      open={local.open}
      defaultOpen={local.defaultOpen}
      onOpenChange={(details) => local.onOpenChange?.(details.open)}
      closeOnInteractOutside={local.closeOnInteractOutside ?? true}
      lazyMount
      unmountOnExit
    >
      <Portal>
        <ArkDialog.Backdrop class="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=open]:fade-in fixed inset-0 z-50 bg-black/40" />
        <ArkDialog.Positioner class="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          <ArkDialog.Content
            class={cn(
              "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=open]:fade-in data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
              "border-md3-outline-variant bg-md3-surface-container shadow-md3-elevation-3",
              "relative flex max-h-[90vh] w-full flex-col overflow-hidden rounded-t-md3-lg border outline-none sm:rounded-md3-lg",
              modalVariants({ width: local.width }),
              local.class,
            )}
          >
            {local.children}
          </ArkDialog.Content>
        </ArkDialog.Positioner>
      </Portal>
    </ArkDialog.Root>
  );
}

interface ModalHeaderProps {
  title: string;
  onClose?: () => void;
  class?: string;
}

function ModalHeader(props: Readonly<ModalHeaderProps>): JSX.Element {
  const [local, rest] = splitProps(props, ["title", "onClose", "class"]);
  return (
    <div
      {...rest}
      class={cn(
        "flex items-center justify-between gap-4 border-b border-md3-outline-variant px-6 py-4",
        local.class,
      )}
    >
      <ArkDialog.Title class="text-md3-title-md font-semibold text-md3-on-surface">
        {local.title}
      </ArkDialog.Title>
      <Show when={local.onClose}>
        <ArkDialog.CloseTrigger
          onClick={local.onClose}
          class="state-layer flex h-8 w-8 items-center justify-center rounded-full text-md3-on-surface-variant transition-colors"
        >
          <Close />
        </ArkDialog.CloseTrigger>
      </Show>
    </div>
  );
}

function ModalBody(props: Readonly<JSX.HTMLAttributes<HTMLDivElement>>): JSX.Element {
  const [local, rest] = splitProps(props, ["class", "children"]);
  return (
    <div {...rest} class={cn("scrollbar-hide flex-1 overflow-y-auto px-6 py-4", local.class)}>
      {local.children}
    </div>
  );
}

function ModalFooter(props: Readonly<JSX.HTMLAttributes<HTMLDivElement>>): JSX.Element {
  const [local, rest] = splitProps(props, ["class", "children"]);
  return (
    <div
      {...rest}
      class={cn(
        "flex items-center justify-end gap-3 border-t border-md3-outline-variant px-6 py-4",
        local.class,
      )}
    >
      {local.children}
    </div>
  );
}

ModalRoot.Header = ModalHeader;
ModalRoot.Body = ModalBody;
ModalRoot.Footer = ModalFooter;

export { ModalRoot as Modal, type ModalProps };

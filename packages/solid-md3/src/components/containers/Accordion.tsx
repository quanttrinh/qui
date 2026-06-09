import { Accordion as ArkAccordion } from "@ark-ui/solid/accordion";
import ExpandMore from "@iconify-solid/material-symbols/expand-more";
import { type JSX, Show, splitProps } from "solid-js";

import { cn } from "../../cn";

interface AccordionRootProps {
  multiple?: boolean;
  collapsible?: boolean;
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (value: string[]) => void;
  disabled?: boolean;
  class?: string;
  children?: JSX.Element;
}

function AccordionRoot(props: Readonly<AccordionRootProps>): JSX.Element {
  const [local, rest] = splitProps(props, [
    "multiple",
    "collapsible",
    "value",
    "defaultValue",
    "onValueChange",
    "disabled",
    "class",
    "children",
  ]);

  return (
    <ArkAccordion.Root
      multiple={local.multiple}
      collapsible={local.collapsible}
      value={local.value}
      defaultValue={local.defaultValue}
      onValueChange={(details) => local.onValueChange?.(details.value)}
      disabled={local.disabled}
      lazyMount
      unmountOnExit
      class={cn("flex flex-col gap-2", local.class)}
      {...rest}
    >
      {local.children}
    </ArkAccordion.Root>
  );
}

interface AccordionItemProps {
  value: string;
  title: JSX.Element;
  description?: JSX.Element;
  disabled?: boolean;
  class?: string;
  children?: JSX.Element;
}

function AccordionItem(props: Readonly<AccordionItemProps>): JSX.Element {
  const [local, rest] = splitProps(props, [
    "value",
    "title",
    "description",
    "disabled",
    "class",
    "children",
  ]);

  return (
    <ArkAccordion.Item
      value={local.value}
      disabled={local.disabled}
      class={cn(
        "overflow-hidden rounded-md3-md border border-md3-outline-variant bg-md3-surface-container-low",
        "transition-shadow data-[state=open]:shadow-md3-elevation-1",
        local.class,
      )}
      {...rest}
    >
      <ArkAccordion.ItemTrigger
        class={cn(
          "state-layer flex w-full items-center gap-3 px-4 py-3 text-left transition-colors",
          !local.disabled && "cursor-pointer",
        )}
      >
        <div class="flex flex-1 flex-col gap-0.5">
          <div class="text-md3-title-md font-medium text-md3-on-surface">{local.title}</div>
          <Show when={local.description}>
            <div class="text-md3-body-sm text-md3-on-surface-variant">{local.description}</div>
          </Show>
        </div>
        <ArkAccordion.ItemIndicator class="flex content-center text-md3-on-surface-variant transition-transform duration-200 data-[state=open]:rotate-180">
          <ExpandMore />
        </ArkAccordion.ItemIndicator>
      </ArkAccordion.ItemTrigger>
      <ArkAccordion.ItemContent class="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=open]:fade-in px-4 pt-1 pb-4">
        <div class="text-md3-body-md text-md3-on-surface-variant">{local.children}</div>
      </ArkAccordion.ItemContent>
    </ArkAccordion.Item>
  );
}

AccordionRoot.Item = AccordionItem;

export { AccordionRoot as Accordion, type AccordionRootProps as AccordionProps };

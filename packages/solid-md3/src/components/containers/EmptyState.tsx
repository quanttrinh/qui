import Inbox from "@iconify-solid/material-symbols/inbox";
import { type JSX, Show } from "solid-js";

import { cn } from "../../cn";

interface EmptyStateProps {
  icon?: JSX.Element;
  title: string;
  description?: string;
  children?: JSX.Element;
  class?: string;
}

export function EmptyState(props: Readonly<EmptyStateProps>): JSX.Element {
  return (
    <div
      class={cn("flex flex-col items-center justify-center gap-3 py-12 text-center", props.class)}
    >
      <Show when={props.icon}>
        <div
          class="flex h-12 w-12 items-center justify-center text-md3-on-surface-variant"
          aria-hidden="true"
        >
          {props.icon}
        </div>
      </Show>
      <div class="flex flex-col gap-1">
        <p class="text-base font-medium text-md3-on-surface">{props.title}</p>
        <Show when={props.description}>
          <p class="text-sm text-md3-on-surface-variant">{props.description}</p>
        </Show>
      </div>
      <Show when={props.children}>
        <div class="mt-2">{props.children}</div>
      </Show>
    </div>
  );
}

export type { EmptyStateProps };

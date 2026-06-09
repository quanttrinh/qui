import type { JSX } from "solid-js";

import { cn } from "../../cn";

export interface AppBarProps {
  class?: string;
  children?: JSX.Element;
}

export function AppBar(props: Readonly<AppBarProps>): JSX.Element {
  return (
    <header
      class={cn(
        "sticky top-0 z-10 flex h-16 shrink-0 items-center gap-3 bg-md3-surface px-4",
        props.class,
      )}
    >
      {props.children}
    </header>
  );
}

import type { JSX } from "solid-js";

import { cn } from "../../cn";
import { Block } from "../containers/Block";

export interface AppShellProps {
  sideNav?: JSX.Element;
  appBar?: JSX.Element;
  side?: "left" | "right";
  class?: string;
  children?: JSX.Element;
}

export function AppShell(props: Readonly<AppShellProps>): JSX.Element {
  const side = (): "left" | "right" => props.side ?? "left";

  return (
    <Block class={cn("flex h-full", props.class)}>
      {props.sideNav}
      <Block variant="column" gap="none" class="min-h-0 min-w-0 flex-1">
        {props.appBar}
        <main
          class={cn(
            "size-full min-h-0 min-w-0 flex-1 overflow-clip bg-md3-surface",
            side() === "left" ? "rounded-tl-md3-lg" : "rounded-tr-md3-lg",
          )}
        >
          {props.children}
        </main>
      </Block>
    </Block>
  );
}

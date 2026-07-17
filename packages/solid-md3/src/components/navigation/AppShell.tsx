import MenuIcon from "@iconify-solid/material-symbols/menu";
import { type JSX, Show, createSignal } from "solid-js";

import { cn } from "../../cn";
import { Button } from "../buttons/Button";
import { Block } from "../containers/Block";
import { SideNavShellContext } from "./SideNav";

export interface AppShellProps {
  sideNav?: JSX.Element;
  appBar?: JSX.Element;
  side?: "left" | "right";
  class?: string;
  children?: JSX.Element;
}

export function AppShell(props: Readonly<AppShellProps>): JSX.Element {
  const side = (): "left" | "right" => props.side ?? "left";

  const [navOpen, setNavOpen] = createSignal(true);

  return (
    <SideNavShellContext.Provider value={{ open: navOpen, setOpen: setNavOpen }}>
      <Block class={cn("flex h-full", props.class)}>
        {props.sideNav}
        <Block variant="column" gap="none" class="min-h-0 min-w-0 flex-1">
          <header
            class={cn(
              "sticky top-0 flex h-16 shrink-0 items-center gap-1 bg-md3-surface px-4",
              side() === "left" ? "flex-row" : "flex-row-reverse",
            )}
          >
            <Show when={props.sideNav}>
              <Button
                iconOnly
                variant="text"
                size="md"
                onClick={() => setNavOpen(true)}
                class="sm:hidden"
                aria-label="Open navigation"
              >
                <MenuIcon />
              </Button>
            </Show>

            <div class="flex-1">{props.appBar}</div>
          </header>
          <main
            class={cn(
              "size-full min-h-0 min-w-0 flex-1 overflow-clip bg-md3-surface",
              side() === "left" ? "sm:rounded-tl-md3-md" : "sm:rounded-tr-md3-md",
            )}
          >
            {props.children}
          </main>
        </Block>
      </Block>
    </SideNavShellContext.Provider>
  );
}

import { createContextStore } from "../shared/context-store";
import { type TabsTriggerRegistration } from "./controller";

export type TabsVariant = "primary" | "secondary";
export type TabsOrientation = "horizontal" | "vertical";

/** The tab state and commands shared with descendant tab parts. */
export interface TabsContext {
  value: () => string | undefined;
  focusedValue: () => string | undefined;
  hasFocus: () => boolean;
  isSelected: (value: string) => boolean;
  isFocused: (value: string) => boolean;
  select: (value: string) => void;
  focus: (value: string) => void;
  blur: () => void;
  move: (delta: 1 | -1) => void;
  edge: (edge: "first" | "last") => void;
  /** Registers a tab list host. Returns an unregister function. */
  registerList: (host: HTMLElement) => () => void;
  /** Registers a trigger host and its internal button. Returns an unregister function. */
  registerTrigger: (value: string, host: HTMLElement, trigger: HTMLButtonElement) => () => void;
  /** Registers a panel host. Returns an unregister function. */
  registerPanel: (value: string, host: HTMLElement) => () => void;
  /** The registered list host. */
  getList: () => HTMLElement | undefined;
  /** The registered trigger for a value. */
  getTrigger: (value: string) => TabsTriggerRegistration | undefined;
  /** The registered panel host for a value. */
  getPanel: (value: string) => HTMLElement | undefined;
  /** Moves DOM focus to the internal tab button for a value. */
  focusTrigger: (value: string) => void;
  variant: () => TabsVariant;
  orientation: () => TabsOrientation;
  textDirection: () => "ltr" | "rtl";
  rootId: () => string;
  listId: () => string;
  triggerId: (value: string) => string;
  panelId: (value: string) => string;
  subscribe: (listener: () => void) => () => void;
}

// oxlint-disable-next-line stencil/ban-side-effects -- Allocating a context map has no side effects.
const tabs = createContextStore<TabsContext>("tabs");

function provideTabs(host: HTMLElement, context: TabsContext): void {
  tabs.provide(host, context);
}

function clearTabs(host: HTMLElement): void {
  tabs.clear(host);
}

function consumeTabs(host: HTMLElement): TabsContext | undefined {
  return tabs.consume(host);
}

export { clearTabs, consumeTabs, provideTabs };

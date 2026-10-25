import { notifyContextProvided } from "../shared/context-part";

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
  variant: () => TabsVariant;
  orientation: () => TabsOrientation;
  textDirection: () => "ltr" | "rtl";
  rootId: () => string;
  listId: () => string;
  triggerId: (value: string) => string;
  panelId: (value: string) => string;
  subscribe: (listener: () => void) => () => void;
}

const tabs = new WeakMap<HTMLElement, TabsContext>();

function provideTabs(host: HTMLElement, context: TabsContext): void {
  tabs.set(host, context);
  notifyContextProvided("tabs");
}

function clearTabs(host: HTMLElement): void {
  tabs.delete(host);
  notifyContextProvided("tabs");
}

function parentElement(node: Element): Element | undefined {
  const parent = node.parentElement;
  if (parent) {
    return parent;
  }
  const root = node.getRootNode();
  return root instanceof ShadowRoot ? root.host : undefined;
}

function consumeTabs(host: HTMLElement): TabsContext | undefined {
  let node = parentElement(host);
  while (node !== undefined) {
    if (node instanceof HTMLElement) {
      const context = tabs.get(node);
      if (context !== undefined) {
        return context;
      }
    }
    node = parentElement(node);
  }
  return undefined;
}

export { clearTabs, consumeTabs, provideTabs };

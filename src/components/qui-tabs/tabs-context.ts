import { type Api as TabsApi } from "@zag-js/tabs";

export type TabsVariant = "primary" | "secondary";

export interface TabsContext {
  api: () => TabsApi;
  variant: () => TabsVariant;
  orientation: () => "horizontal" | "vertical";
  subscribe: (listener: () => void) => () => void;
}

const tabs = new WeakMap<HTMLElement, TabsContext>();

function provideTabs(host: HTMLElement, context: TabsContext): void {
  tabs.set(host, context);
}

function clearTabs(host: HTMLElement): void {
  tabs.delete(host);
}

function consumeTabs(host: HTMLElement): TabsContext | undefined {
  let node: Element | undefined = host.parentElement ?? undefined;
  while (node !== undefined) {
    if (node instanceof HTMLElement) {
      const context = tabs.get(node);
      if (context !== undefined) {
        return context;
      }
    }
    node = node.parentElement ?? undefined;
  }
  return undefined;
}

export { clearTabs, consumeTabs, provideTabs };

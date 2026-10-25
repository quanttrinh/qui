import { notifyContextChanged } from "../shared/context-part";

export interface AccordionItem {
  value: string;
  disabled?: boolean;
}

/** The accordion state and ids shared with descendant parts. */
export interface AccordionContext {
  isExpanded: (value: string) => boolean;
  isFocused: (value: string) => boolean;
  isDisabled: () => boolean;
  orientation: () => "horizontal" | "vertical";
  textDirection: () => "ltr" | "rtl" | undefined;
  toggle: (value: string) => void;
  focus: (value: string) => void;
  blur: () => void;
  move: (fromValue: string, delta: 1 | -1) => void;
  edge: (edge: "first" | "last") => void;
  rootId: () => string;
  itemId: (value: string) => string;
  triggerId: (value: string) => string;
  contentId: (value: string) => string;
  subscribe: (listener: () => void) => () => void;
}

export interface AccordionItemContext extends AccordionContext {
  item: () => AccordionItem;
  /** Whether this item or its accordion is disabled. */
  isItemDisabled: () => boolean;
}

const accordions = new WeakMap<HTMLElement, AccordionContext>();
const accordionItems = new WeakMap<HTMLElement, AccordionItemContext>();

function provideAccordion(host: HTMLElement, context: AccordionContext): void {
  accordions.set(host, context);
  notifyContextChanged("accordion");
}

function clearAccordion(host: HTMLElement): void {
  accordions.delete(host);
  notifyContextChanged("accordion");
}

function parentElement(node: Element): Element | undefined {
  const parent = node.parentElement;
  if (parent) {
    return parent;
  }
  const root = node.getRootNode();
  return root instanceof ShadowRoot ? root.host : undefined;
}

function consumeAccordion(host: HTMLElement): AccordionContext | undefined {
  let node = parentElement(host);
  while (node !== undefined) {
    if (node instanceof HTMLElement) {
      const context = accordions.get(node);
      if (context !== undefined) {
        return context;
      }
    }
    node = parentElement(node);
  }
  return undefined;
}

function provideAccordionItem(host: HTMLElement, context: AccordionItemContext): void {
  accordionItems.set(host, context);
  notifyContextChanged("accordion-item");
}

function clearAccordionItem(host: HTMLElement): void {
  accordionItems.delete(host);
  notifyContextChanged("accordion-item");
}

function consumeAccordionItem(host: HTMLElement): AccordionItemContext | undefined {
  let node = parentElement(host);
  while (node !== undefined) {
    if (node instanceof HTMLElement) {
      const context = accordionItems.get(node);
      if (context !== undefined) {
        return context;
      }
    }
    node = parentElement(node);
  }
  return undefined;
}

export {
  clearAccordion,
  clearAccordionItem,
  consumeAccordion,
  consumeAccordionItem,
  provideAccordion,
  provideAccordionItem,
};

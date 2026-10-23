import { type Api as AccordionApi, type ItemProps } from "@zag-js/accordion";

export interface AccordionContext {
  api: () => AccordionApi;
  subscribe: (listener: () => void) => () => void;
}

export interface AccordionItemContext extends AccordionContext {
  item: () => ItemProps;
}

const accordions = new WeakMap<HTMLElement, AccordionContext>();
const accordionItems = new WeakMap<HTMLElement, AccordionItemContext>();

function provideAccordion(host: HTMLElement, context: AccordionContext): void {
  accordions.set(host, context);
}

function clearAccordion(host: HTMLElement): void {
  accordions.delete(host);
}

function consumeAccordion(host: HTMLElement): AccordionContext | undefined {
  let node: Element | undefined = host.parentElement ?? undefined;
  while (node !== undefined) {
    if (node instanceof HTMLElement) {
      const context = accordions.get(node);
      if (context !== undefined) {
        return context;
      }
    }
    node = node.parentElement ?? undefined;
  }
  return undefined;
}

function provideAccordionItem(host: HTMLElement, context: AccordionItemContext): void {
  accordionItems.set(host, context);
}

function clearAccordionItem(host: HTMLElement): void {
  accordionItems.delete(host);
}

function consumeAccordionItem(host: HTMLElement): AccordionItemContext | undefined {
  let node: Element | undefined = host.parentElement ?? undefined;
  while (node !== undefined) {
    if (node instanceof HTMLElement) {
      const context = accordionItems.get(node);
      if (context !== undefined) {
        return context;
      }
    }
    node = node.parentElement ?? undefined;
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

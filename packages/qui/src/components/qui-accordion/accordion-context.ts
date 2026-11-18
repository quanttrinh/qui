import type { AccordionTriggerRegistration } from "./controller";

import type { ContextProviderHandle } from "../shared/context";

import { clearContext, createContext, provideContext } from "../shared/context";

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
  /** Registers a trigger host and its internal button. Returns an unregister function. */
  registerTrigger: (value: string, host: HTMLElement, trigger: HTMLButtonElement) => () => void;
  /** Registers a content host. Returns an unregister function. */
  registerContent: (value: string, host: HTMLElement) => () => void;
  /** The registered trigger for a value. */
  getTrigger: (value: string) => AccordionTriggerRegistration | undefined;
  /** The registered content host for a value. */
  getContent: (value: string) => HTMLElement | undefined;
  /** Moves DOM focus to the internal trigger button for a value. */
  focusTrigger: (value: string) => void;
  /** Clears cached trigger state after a trigger's disabled state changes. */
  invalidateTriggers: () => void;
  rootId: () => string;
  itemId: (value: string) => string;
  triggerId: (value: string) => string;
  contentId: (value: string) => string;
}

export interface AccordionItemContext extends AccordionContext {
  item: () => AccordionItem;
  /** Whether this item or its accordion is disabled. */
  isItemDisabled: () => boolean;
}

export const accordionContext = createContext<AccordionContext>();
export const accordionItemContext = createContext<AccordionItemContext>();

export const provideAccordion = (
  host: Element,
  context: AccordionContext,
): ContextProviderHandle<AccordionContext> => provideContext(host, accordionContext, context);
export const clearAccordion = (host: Element): void => {
  clearContext(host, accordionContext);
};

export const provideAccordionItem = (
  host: Element,
  context: AccordionItemContext,
): ContextProviderHandle<AccordionItemContext> => provideContext(host, accordionItemContext, context);
export const clearAccordionItem = (host: Element): void => {
  clearContext(host, accordionItemContext);
};

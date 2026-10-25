import { notifyContextProvided } from "../shared/context-part";

/** A radio item's component-owned props. */
export interface RadioItem {
  value: string;
  disabled?: boolean;
  invalid?: boolean;
}

/** Resolved state for one radio item. */
export interface RadioItemState {
  checked: boolean;
  disabled: boolean;
  invalid: boolean;
  focused: boolean;
  focusVisible: boolean;
}

/** The radio-group state and ids shared with descendant radio items. */
export interface RadioGroupContext {
  value: () => string | undefined;
  isDisabled: () => boolean;
  isReadOnly: () => boolean;
  isInvalid: () => boolean;
  isRequired: () => boolean;
  orientation: () => "horizontal" | "vertical";
  textDirection: () => "ltr" | "rtl" | undefined;
  itemState: (item: RadioItem) => RadioItemState;
  select: (value: string) => void;
  focus: (value: string, focusVisible: boolean) => void;
  blur: () => void;
  rootId: () => string;
  itemId: (value: string) => string;
  inputId: (value: string) => string;
  controlId: (value: string) => string;
  labelId: (value: string) => string;
  subscribe: (listener: () => void) => () => void;
}

const groups = new WeakMap<HTMLElement, RadioGroupContext>();

function provideRadioGroup(host: HTMLElement, group: RadioGroupContext): void {
  groups.set(host, group);
  notifyContextProvided("radio-group");
}

function clearRadioGroup(host: HTMLElement): void {
  groups.delete(host);
  notifyContextProvided("radio-group");
}

function parentElement(node: Element): Element | undefined {
  const parent = node.parentElement;
  if (parent) {
    return parent;
  }
  const root = node.getRootNode();
  return root instanceof ShadowRoot ? root.host : undefined;
}

/** Find the closest ancestor radio group, crossing shadow boundaries. */
function consumeRadioGroup(host: HTMLElement): RadioGroupContext | undefined {
  let node = parentElement(host);
  while (node !== undefined) {
    if (node instanceof HTMLElement) {
      const group = groups.get(node);
      if (group !== undefined) {
        return group;
      }
    }
    node = parentElement(node);
  }
  return undefined;
}

export { clearRadioGroup, consumeRadioGroup, provideRadioGroup };

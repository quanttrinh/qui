/** The subset of Zag item props that a radio item exposes. */
export interface RadioItem {
  value: string;
  disabled?: boolean;
  invalid?: boolean;
}

/** Props for every part of one radio item, captured from a single API snapshot. */
export interface RadioItemProps {
  root: Record<string, unknown>;
  control: Record<string, unknown>;
  text: Record<string, unknown>;
  hiddenInput: Record<string, unknown>;
}

/** The radio-group API shared with descendant radio items. */
export interface RadioGroupApi {
  itemProps: (item: RadioItem) => RadioItemProps;
  /** Subscribe to group state changes. Returns an unsubscribe function. */
  subscribe: (listener: () => void) => () => void;
}

const groups = new WeakMap<HTMLElement, RadioGroupApi>();

function provideRadioGroup(host: HTMLElement, group: RadioGroupApi): void {
  groups.set(host, group);
}

function clearRadioGroup(host: HTMLElement): void {
  groups.delete(host);
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
function consumeRadioGroup(host: HTMLElement): RadioGroupApi | undefined {
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

import { describe, expect, it, vi } from "vitest";

import {
  clearAccordion,
  clearAccordionItem,
  consumeAccordion,
  consumeAccordionItem,
  provideAccordion,
  provideAccordionItem,
  type AccordionContext,
  type AccordionItemContext,
} from "../qui-accordion/accordion-context";
import {
  clearDialog,
  consumeDialog,
  provideDialog,
  type DialogContext,
} from "../qui-dialog/context";
import {
  clearRadioGroup,
  consumeRadioGroup,
  provideRadioGroup,
  type RadioGroupContext,
} from "../qui-radio/context";
import { clearTabs, consumeTabs, provideTabs, type TabsContext } from "../qui-tabs/context";
import { consumeContextPart, type ContextPart } from "./context-part";
import { clearField, consumeField, provideField, type FieldApi } from "./field/context";
import { FormController } from "./form-control/controller";

function createFieldApi(): FieldApi {
  return {
    ids: {
      root: "field",
      control: "field-control",
      label: "field-label",
      errorText: "field-error",
      helperText: "field-helper",
    },
    invalid: () => false,
    disabled: () => false,
    readOnly: () => false,
    required: () => false,
    getInputProps: () => ({
      id: "field-control",
      disabled: false,
      required: false,
      "data-scope": "field",
      "data-part": "input",
    }),
    getLabelProps: () => ({
      id: "field-label",
      htmlFor: "field-control",
      "data-scope": "field",
      "data-part": "label",
    }),
    getHelperTextProps: () => ({
      id: "field-helper",
      "data-scope": "field",
      "data-part": "helper-text",
    }),
    getErrorTextProps: () => ({
      id: "field-error",
      "data-scope": "field",
      "data-part": "error-text",
    }),
    registerHelperText: () => () => undefined,
    registerErrorText: () => () => undefined,
    subscribe: () => () => undefined,
  };
}

function createTabsContext(): TabsContext {
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  return { subscribe: () => () => undefined } as unknown as TabsContext;
}

function createRadioGroupContext(): RadioGroupContext {
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  return { subscribe: () => () => undefined } as unknown as RadioGroupContext;
}

function createDialogContext(): DialogContext {
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  return { subscribe: () => () => undefined } as unknown as DialogContext;
}

function createAccordionContext(): AccordionContext {
  return {
    isExpanded: () => false,
    isFocused: () => false,
    isDisabled: () => false,
    orientation: () => "vertical",
    textDirection: () => undefined,
    toggle: (): void => undefined,
    focus: (): void => undefined,
    blur: (): void => undefined,
    move: (): void => undefined,
    edge: (): void => undefined,
    rootId: () => "accordion",
    itemId: (value) => `accordion-item-${value}`,
    triggerId: (value) => `accordion-trigger-${value}`,
    contentId: (value) => `accordion-content-${value}`,
    subscribe: () => () => undefined,
  };
}

function createItemContext(accordion: AccordionContext, value: string): AccordionItemContext {
  return {
    ...accordion,
    item: () => ({ value }),
    isItemDisabled: () => accordion.isDisabled(),
  };
}

function createTree(): { provider: HTMLElement; consumer: HTMLElement } {
  const provider = document.createElement("div");
  const consumer = document.createElement("div");
  provider.append(consumer);
  document.body.append(provider);
  return { provider, consumer };
}

describe("context provider notifications", () => {
  it("notifies a waiting part when a real field provider registers", async () => {
    const { provider, consumer } = createTree();
    const field = createFieldApi();
    const update = vi.fn((): void => undefined);
    const part = consumeContextPart({
      host: () => consumer,
      key: "field",
      consume: consumeField,
      update,
    });

    part.hostWillLoad();
    expect(part.context).toBeUndefined();

    provideField(provider, field);
    await Promise.resolve();

    expect(part.context).toBe(field);
    expect(update).toHaveBeenCalledOnce();

    part.hostDisconnected();
    clearField(provider);
    provider.remove();
  });

  it("attaches a FormController after a late field provider", async () => {
    const { provider, consumer } = createTree();
    const field = createFieldApi();
    const onChange = vi.fn((): void => undefined);
    const requestUpdate = vi.fn((): void => undefined);
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion
    const internals = {
      setFormValue: vi.fn(),
      setValidity: vi.fn(),
    } as unknown as ElementInternals;
    const controller = new FormController({
      getHost: () => consumer,
      getInternals: () => internals,
      getName: () => "test",
      getMultiple: () => false,
      getValue: () => [],
      getDisabled: () => false,
      getReadOnly: () => false,
      getRequired: () => false,
      getInvalid: () => false,
      getValidationElement: () => undefined,
      onReset: (): void => undefined,
      onRestore: (): void => undefined,
      requestUpdate,
      onChange,
    });

    controller.hostConnected();
    expect(controller.fieldApi).toBeUndefined();

    provideField(provider, field);
    await Promise.resolve();

    expect(controller.fieldApi).toBe(field);
    expect(onChange).toHaveBeenCalledOnce();
    expect(requestUpdate).toHaveBeenCalledOnce();

    clearField(provider);
    await Promise.resolve();

    expect(controller.fieldApi).toBeUndefined();
    expect(onChange).toHaveBeenCalledTimes(2);
    expect(requestUpdate).toHaveBeenCalledTimes(2);

    controller.hostDisconnected();
    provider.remove();
  });

  it("replaces a field and tears down the previous registration", async () => {
    const { provider, consumer } = createTree();
    const first = createFieldApi();
    const second = createFieldApi();
    const teardown = vi.fn();
    const setup = vi.fn(() => teardown);
    const part = consumeContextPart({
      host: () => consumer,
      key: "field",
      consume: consumeField,
      setup,
    });

    part.hostWillLoad();
    provideField(provider, first);
    await Promise.resolve();
    expect(part.context).toBe(first);

    provideField(provider, second);
    await Promise.resolve();

    expect(part.context).toBe(second);
    expect(teardown).toHaveBeenCalledOnce();
    expect(setup).toHaveBeenLastCalledWith(second);

    part.hostDisconnected();
    clearField(provider);
    provider.remove();
  });
});

describe("late providers for other context families", () => {
  it("attaches a tabs part after its provider", async () => {
    const { provider, consumer } = createTree();
    const tabs = createTabsContext();
    const part = consumeContextPart({
      host: () => consumer,
      key: "tabs",
      consume: consumeTabs,
    });

    part.hostWillLoad();
    provideTabs(provider, tabs);
    await Promise.resolve();

    expect(part.context).toBe(tabs);

    part.hostDisconnected();
    clearTabs(provider);
    provider.remove();
  });

  it("attaches a radio part after its group", async () => {
    const { provider, consumer } = createTree();
    const group = createRadioGroupContext();
    const part = consumeContextPart({
      host: () => consumer,
      key: "radio-group",
      consume: consumeRadioGroup,
    });

    part.hostWillLoad();
    provideRadioGroup(provider, group);
    await Promise.resolve();

    expect(part.context).toBe(group);

    part.hostDisconnected();
    clearRadioGroup(provider);
    provider.remove();
  });

  it("attaches a dialog part after its provider", async () => {
    const { provider, consumer } = createTree();
    const dialog = createDialogContext();
    const part = consumeContextPart({
      host: () => consumer,
      key: "dialog",
      consume: consumeDialog,
    });

    part.hostWillLoad();
    provideDialog(provider, dialog);
    await Promise.resolve();

    expect(part.context).toBe(dialog);

    part.hostDisconnected();
    clearDialog(provider);
    provider.remove();
  });
});

function createAccordionTree(values: string[]): {
  host: HTMLElement;
  itemParts: ContextPart<AccordionContext>[];
  contentParts: ContextPart<AccordionItemContext>[];
} {
  const host = document.createElement("div");
  document.body.append(host);
  const itemParts: ContextPart<AccordionContext>[] = [];
  const contentParts: ContextPart<AccordionItemContext>[] = [];

  for (const value of values) {
    const itemHost = document.createElement("div");
    const contentHost = document.createElement("div");
    itemHost.append(contentHost);
    host.append(itemHost);

    const itemPart = consumeContextPart({
      host: () => itemHost,
      key: "accordion",
      consume: consumeAccordion,
      setup: (accordion: AccordionContext) => {
        provideAccordionItem(itemHost, createItemContext(accordion, value));
        return (): void => {
          clearAccordionItem(itemHost);
        };
      },
    });
    const contentPart = consumeContextPart({
      host: () => contentHost,
      key: "accordion-item",
      consume: consumeAccordionItem,
    });

    itemPart.hostWillLoad();
    contentPart.hostWillLoad();
    itemParts.push(itemPart);
    contentParts.push(contentPart);
  }

  return { host, itemParts, contentParts };
}

function destroyAccordionTree(tree: ReturnType<typeof createAccordionTree>): void {
  for (const part of [...tree.itemParts, ...tree.contentParts]) {
    part.hostDisconnected();
  }
  clearAccordion(tree.host);
  tree.host.remove();
}

describe("accordion cascading notifications", () => {
  it("attaches every item and consumer when the accordion provider appears", async () => {
    const tree = createAccordionTree(["one", "two", "three"]);
    expect(tree.itemParts.every((part) => part.context === undefined)).toBe(true);
    expect(tree.contentParts.every((part) => part.context === undefined)).toBe(true);

    const accordion = createAccordionContext();
    provideAccordion(tree.host, accordion);
    await Promise.resolve();

    expect(tree.itemParts.every((part) => part.context === accordion)).toBe(true);
    expect(tree.contentParts.every((part) => part.context !== undefined)).toBe(true);
    destroyAccordionTree(tree);
  });
});

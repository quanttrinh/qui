import { describe, expect, it, vi } from "vitest";

import { consumeContextPart } from "./context-part";
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

    controller.hostDisconnected();
    clearField(provider);
    provider.remove();
  });
});

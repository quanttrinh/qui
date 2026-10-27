import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { clearField, provideField, type FieldApi } from "../field/context";
import { type FieldControlHandle } from "../field/registry";
import { FormController } from "./controller";

function FakeShadowRoot(): void {}

class FakeElement {
  parentElement: FakeElement | undefined;
  readonly root = {};
  readonly getRootNode = (): object => this.root;
}

const globals = globalThis as Record<string, unknown>;
const originalHTMLElement = globals.HTMLElement;
const originalShadowRoot = globals.ShadowRoot;

beforeAll(() => {
  globals.HTMLElement = FakeElement;
  globals.ShadowRoot = FakeShadowRoot;
});

afterAll(() => {
  globals.HTMLElement = originalHTMLElement;
  globals.ShadowRoot = originalShadowRoot;
});

function createFieldApi(): { field: FieldApi; registerControl: ReturnType<typeof vi.fn> } {
  const registerControl = vi.fn(() => vi.fn());
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  const field = {
    registerControl,
    subscribe: () => () => undefined,
    disabled: () => false,
    readOnly: () => false,
    required: () => false,
    invalid: () => false,
  } as unknown as FieldApi;
  return { field, registerControl };
}

function createController(host: FakeElement): FormController {
  const setFormValue = vi.fn();
  const setValidity = vi.fn();
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  const internals = { setFormValue, setValidity } as unknown as ElementInternals;
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  const controller = new FormController({
    getHost: () => host as unknown as HTMLElement,
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
    requestUpdate: (): void => undefined,
  });
  return controller;
}

function appendToProvider(): { provider: FakeElement; host: FakeElement } {
  const provider = new FakeElement();
  const host = new FakeElement();
  host.parentElement = provider;
  return { provider, host };
}

const control: FieldControlHandle = {
  focus: (): void => undefined,
};

describe("FormController field control registration", () => {
  it("registers the control when attached and unregisters on disconnect", () => {
    const { provider, host } = appendToProvider();
    const { field, registerControl } = createFieldApi();
    const unregister = vi.fn();
    registerControl.mockReturnValue(unregister);
    provideField(provider as unknown as HTMLElement, field);
    const controller = createController(host);

    controller.setControl(control);
    controller.hostConnected();

    expect(registerControl).toHaveBeenCalledWith(control);

    controller.hostDisconnected();

    expect(unregister).toHaveBeenCalledOnce();
    clearField(provider as unknown as HTMLElement);
  });

  it("registers a control set after the field is already attached", () => {
    const { provider, host } = appendToProvider();
    const { field, registerControl } = createFieldApi();
    provideField(provider as unknown as HTMLElement, field);
    const controller = createController(host);
    controller.hostConnected();
    expect(registerControl).not.toHaveBeenCalled();

    controller.setControl(control);

    expect(registerControl).toHaveBeenCalledWith(control);
    controller.hostDisconnected();
    clearField(provider as unknown as HTMLElement);
  });

  it("registers with a field that appears after connection", async () => {
    const { provider, host } = appendToProvider();
    const { field, registerControl } = createFieldApi();
    const controller = createController(host);
    controller.setControl(control);
    controller.hostConnected();
    expect(registerControl).not.toHaveBeenCalled();

    provideField(provider as unknown as HTMLElement, field);
    await Promise.resolve();

    expect(registerControl).toHaveBeenCalledWith(control);

    controller.hostDisconnected();
    clearField(provider as unknown as HTMLElement);
  });

  it("does not register a control when the host has no field", () => {
    const host = new FakeElement();
    const { registerControl } = createFieldApi();
    const controller = createController(host);

    controller.setControl(control);
    controller.hostConnected();

    expect(registerControl).not.toHaveBeenCalled();

    controller.hostDisconnected();
  });
});

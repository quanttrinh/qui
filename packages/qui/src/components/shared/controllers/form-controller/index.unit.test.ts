import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { createTestControllerHost } from "../../../../../tests/test-utils/controller-host";
import { clearField, provideField, type FieldApi } from "../../helpers/field/context";
import { type FieldControlHandle } from "../../helpers/field/registry";
import { FormController } from "./index";

function FakeShadowRoot(this: { nodeType: number }): void {
  this.nodeType = 11;
}

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
  const internals = { setFormValue, setValidity } as unknown as ElementInternals;
  const controller = new FormController(createTestControllerHost(host as unknown as HTMLElement), {
    internals: () => internals,
    state: () => ({ name: "test", multiple: false, values: [] }),
    disabled: () => false,
    readOnly: () => false,
    required: () => false,
    invalid: () => false,
    onReset: (): void => undefined,
    onRestore: (): void => undefined,
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

function createSyncController(): {
  controller: FormController;
  setFormValue: ReturnType<typeof vi.fn>;
  setValidity: ReturnType<typeof vi.fn>;
  setDisabled: (value: boolean) => void;
  setRequired: (value: boolean) => void;
  setInvalid: (value: boolean) => void;
  setName: (value: string) => void;
  setMultiple: (value: boolean) => void;
  setValues: (values: string[]) => void;
  setElement: (element: HTMLElement | undefined) => void;
} {
  let disabled = false;
  let required = false;
  let invalid = false;
  let name = "test";
  let multiple = false;
  let values: string[] = [];
  let element: HTMLElement | undefined;
  const setFormValue = vi.fn();
  const setValidity = vi.fn();
  const controller = new FormController(
    createTestControllerHost(new FakeElement() as unknown as HTMLElement),
    {
      internals: () => ({ setFormValue, setValidity }) as unknown as ElementInternals,
      state: () => ({ name, multiple, values, validationElement: element }),
      disabled: () => disabled,
      readOnly: () => false,
      required: () => required,
      invalid: () => invalid,
      onReset: (): void => undefined,
      onRestore: (): void => undefined,
    },
  );
  return {
    controller,
    setFormValue,
    setValidity,
    setDisabled: (value): void => {
      disabled = value;
    },
    setRequired: (value): void => {
      required = value;
    },
    setInvalid: (value): void => {
      invalid = value;
    },
    setName: (value): void => {
      name = value;
    },
    setMultiple: (value): void => {
      multiple = value;
    },
    setValues: (next): void => {
      values = next;
    },
    setElement: (next): void => {
      element = next;
    },
  };
}

describe("FormController sync", () => {
  it("writes the form value only when its inputs change", () => {
    const { controller, setFormValue, setDisabled, setMultiple, setName, setValues } =
      createSyncController();

    controller.sync();
    expect(setFormValue).toHaveBeenCalledTimes(1);

    controller.sync();
    expect(setFormValue).toHaveBeenCalledTimes(1);

    setValues(["next"]);
    controller.sync();
    expect(setFormValue).toHaveBeenCalledTimes(2);

    setName("other");
    controller.sync();
    expect(setFormValue).toHaveBeenCalledTimes(3);

    setMultiple(true);
    controller.sync();
    expect(setFormValue).toHaveBeenCalledTimes(4);

    setDisabled(true);
    controller.sync();
    expect(setFormValue).toHaveBeenCalledTimes(5);
  });

  it("writes validity on every sync, including a late anchor", () => {
    const { controller, setValidity, setElement, setRequired } = createSyncController();
    const element = new FakeElement() as unknown as HTMLElement;

    setRequired(true);
    controller.sync();
    setElement(element);
    controller.sync();

    expect(setValidity).toHaveBeenCalledTimes(2);
    expect(setValidity.mock.calls.at(-1)?.[2] === element).toBe(true);
  });

  it("prefers invalid over required in default validity", () => {
    const { controller, setInvalid, setRequired, setValidity } = createSyncController();

    setRequired(true);
    setInvalid(true);
    controller.sync();

    expect(setValidity.mock.calls.at(-1)?.[0]).toEqual({ customError: true });
  });

  it("does not rewrite an unchanged value after reset or restore", () => {
    const { controller, setFormValue, setValidity } = createSyncController();

    controller.sync();
    expect(setFormValue).toHaveBeenCalledTimes(1);

    controller.reset();
    controller.restore(JSON.stringify([]));

    expect(setFormValue).toHaveBeenCalledTimes(1);
    expect(setValidity).toHaveBeenCalledTimes(3);
  });
});

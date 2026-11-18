import { describe, expect, it, vi } from "vitest";

import type { FieldApi } from "../../helpers/field/context";
import type { FieldControlHandle } from "../../helpers/field/registry";

import {
  contextDocument,
  createElement,
  cleanup,
} from "../../../../../tests/test-utils/context-dom";
import { createTestControllerHost } from "../../../../../tests/test-utils/controller-host";
import { clearField, provideField } from "../../helpers/field/context";
import { FormController } from "./index";

function createFieldApi(): { field: FieldApi; registerControl: ReturnType<typeof vi.fn> } {
  const registerControl = vi.fn(() => vi.fn());
  const field: FieldApi = {
    ids: {
      root: "field",
      control: "control",
      label: "label",
      errorText: "error",
      helperText: "helper",
    },
    registerControl,
    registerLabel: () => (): void => undefined,
    registerHelperText: () => (): void => undefined,
    registerErrorText: () => (): void => undefined,
    getLabelHost: () => undefined,
    getHelperTextHosts: () => [],
    getErrorTextHosts: () => [],
    getInputProps: () => ({
      id: "control",
      disabled: false,
      required: false,
      "data-scope": "field",
      "data-part": "input",
    }),
    getLabelProps: () => ({
      id: "label",
      htmlFor: "control",
      "data-scope": "field",
      "data-part": "label",
    }),
    getHelperTextProps: () => ({ id: "helper", "data-scope": "field", "data-part": "helper-text" }),
    getErrorTextProps: () => ({ id: "error", "data-scope": "field", "data-part": "error-text" }),
    focusControl: (): void => undefined,
    clickControl: (): void => undefined,
    disabled: () => false,
    readOnly: () => false,
    required: () => false,
    invalid: () => false,
  };
  return { field, registerControl };
}

function createController(host: HTMLElement): FormController {
  const setFormValue = vi.fn();
  const setValidity = vi.fn();
  const internals = { setFormValue, setValidity } as unknown as ElementInternals;
  const controller = new FormController(createTestControllerHost(host), {
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

function appendToProvider(): { provider: HTMLElement; host: HTMLElement } {
  const provider = createElement();
  const host = createElement();
  provider.appendChild(host);
  contextDocument.body.appendChild(provider);
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
    provideField(provider, field);
    const controller = createController(host);

    controller.setControl(control);
    controller.hostConnected();

    expect(registerControl).toHaveBeenCalledWith(control);

    controller.hostDisconnected();

    expect(unregister).toHaveBeenCalledOnce();
    clearField(provider);
    cleanup(provider);
  });

  it("registers a control set after the field is already attached", () => {
    const { provider, host } = appendToProvider();
    const { field, registerControl } = createFieldApi();
    provideField(provider, field);
    const controller = createController(host);
    controller.hostConnected();
    expect(registerControl).not.toHaveBeenCalled();

    controller.setControl(control);

    expect(registerControl).toHaveBeenCalledWith(control);
    controller.hostDisconnected();
    clearField(provider);
    cleanup(provider);
  });

  it("registers with a field that appears after connection", async () => {
    const { provider, host } = appendToProvider();
    const { field, registerControl } = createFieldApi();
    const controller = createController(host);
    controller.setControl(control);
    controller.hostConnected();
    expect(registerControl).not.toHaveBeenCalled();

    provideField(provider, field);
    await Promise.resolve();

    expect(registerControl).toHaveBeenCalledWith(control);

    controller.hostDisconnected();
    clearField(provider);
    cleanup(provider);
  });

  it("does not register a control when the host has no field", () => {
    const host = createElement();
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
  const controller = new FormController(createTestControllerHost(createElement()), {
    internals: () => ({ setFormValue, setValidity }) as unknown as ElementInternals,
    state: () => ({ name, multiple, values, validationElement: element }),
    disabled: () => disabled,
    readOnly: () => false,
    required: () => required,
    invalid: () => invalid,
    onReset: (): void => undefined,
    onRestore: (): void => undefined,
  });
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
    const element = createElement();

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

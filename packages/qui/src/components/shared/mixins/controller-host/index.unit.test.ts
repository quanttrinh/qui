import { Mixin } from "@stencil/core";
import { describe, expect, it } from "vitest";

import { TestController } from "../../../../../tests/test-utils/test-controller";
import { ControllerHostMixin } from "./index";

class TestComponent extends Mixin(ControllerHostMixin) {
  protected readonly host = {} as HTMLElement;
}

describe("ControllerHostMixin", () => {
  it("forwards lifecycle hooks to registered controllers", () => {
    const component = new TestComponent();
    const controller = new TestController(component);

    component.componentWillLoad();
    component.connectedCallback();
    component.disconnectedCallback();

    expect(controller.events).toEqual(["willLoad", "connected", "disconnected"]);
  });

  it("disconnects a controller removed while connected", () => {
    const component = new TestComponent();
    const controller = new TestController(component);

    component.connectedCallback();
    component.removeController(controller);

    expect(controller.events).toEqual(["connected", "disconnected"]);
  });

  it("does not register the same controller twice", () => {
    const component = new TestComponent();
    const controller = new TestController(component);

    component.addController(controller);
    component.connectedCallback();

    expect(controller.events).toEqual(["connected"]);
  });
});

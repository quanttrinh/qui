import { describe, expect, it } from "vitest";

import { createTestControllerHost } from "../../../test-utils/controller-host";
import { ReactiveControlBase } from "./component-base";
import { ReactiveControllerBase } from "./controller";

class TestController extends ReactiveControllerBase {
  public readonly events: string[] = [];

  public update(): void {
    this.requestUpdate();
  }

  public hostConnected(): void {
    this.events.push("connected");
  }

  public hostDisconnected(): void {
    this.events.push("disconnected");
  }

  public hostWillLoad(): void {
    this.events.push("willLoad");
  }
}

class TestComponent extends ReactiveControlBase {
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- lifecycle tests never touch the element.
  protected readonly host = {} as HTMLElement;
}

describe("ReactiveControllerBase", () => {
  it("registers itself with the host", () => {
    const host = createTestControllerHost();
    const controller = new TestController(host);

    expect(host.controllers.has(controller)).toBe(true);
  });

  it("delegates requestUpdate to the host", () => {
    const host = createTestControllerHost();
    const controller = new TestController(host);

    controller.update();

    expect(host.updateCount).toBe(1);
  });
});

describe("ReactiveControlBase", () => {
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

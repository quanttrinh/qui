import { forceUpdate } from "@stencil/core";

import { type ReactiveController, type ReactiveControllerHost } from "./controller";

/**
 * Composition host for Stencil components.
 *
 * Extend it, create controllers with `new Controller(this, options)`, and call
 * `super.<lifecycle>()` from any override. The base forwards Stencil lifecycle
 * hooks to every registered controller and provides the `requestUpdate()` the
 * controllers use.
 */
export abstract class ReactiveControlBase implements ReactiveControllerHost {
  private readonly controllers = new Set<ReactiveController>();
  private connected = false;

  /** The Stencil `@Element()` host declared by the concrete component. */
  protected abstract readonly host: HTMLElement;

  public get hostElement(): HTMLElement {
    return this.host;
  }

  public addController(controller: ReactiveController): void {
    // Controllers are registered during field initialization, before Stencil
    // connects the element. Re-registering the same controller is a no-op.
    this.controllers.add(controller);
  }

  public removeController(controller: ReactiveController): void {
    if (!this.controllers.delete(controller)) {
      return;
    }
    if (this.connected) {
      controller.hostDisconnected?.();
    }
  }

  public requestUpdate(): void {
    if (this.host !== undefined) {
      forceUpdate(this.host);
    }
  }

  public connectedCallback(): void {
    this.connected = true;
    for (const controller of this.controllers) {
      controller.hostConnected?.();
    }
  }

  public disconnectedCallback(): void {
    this.connected = false;
    for (const controller of this.controllers) {
      controller.hostDisconnected?.();
    }
  }

  public componentWillLoad(): void {
    for (const controller of this.controllers) {
      controller.hostWillLoad?.();
    }
  }

  public componentDidLoad(): void {
    for (const controller of this.controllers) {
      controller.hostDidLoad?.();
    }
  }

  public componentWillRender(): void {
    for (const controller of this.controllers) {
      controller.hostWillRender?.();
    }
  }

  public componentDidRender(): void {
    for (const controller of this.controllers) {
      controller.hostDidRender?.();
    }
  }

  public componentWillUpdate(): void {
    for (const controller of this.controllers) {
      controller.hostWillUpdate?.();
    }
  }

  public componentDidUpdate(): void {
    for (const controller of this.controllers) {
      controller.hostDidUpdate?.();
    }
  }
}

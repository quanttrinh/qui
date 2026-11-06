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

  get hostElement(): HTMLElement {
    return this.host;
  }

  addController(controller: ReactiveController): void {
    // Controllers are registered during field initialization, before Stencil
    // Connects the element. A duplicate registration is a no-op.
    this.controllers.add(controller);
  }

  removeController(controller: ReactiveController): void {
    if (!this.controllers.delete(controller)) {
      return;
    }
    if (this.connected) {
      controller.hostDisconnected?.();
    }
  }

  requestUpdate(): void {
    forceUpdate(this.host);
    this.onRequestUpdate?.();
  }

  /** Runs after a controller requests a render, e.g. to notify context subscribers. */
  protected onRequestUpdate?(): void;

  connectedCallback(): void {
    this.connected = true;
    for (const controller of this.controllers) {
      controller.hostConnected?.();
    }
  }

  disconnectedCallback(): void {
    this.connected = false;
    for (const controller of this.controllers) {
      controller.hostDisconnected?.();
    }
  }

  componentWillLoad(): void {
    for (const controller of this.controllers) {
      controller.hostWillLoad?.();
    }
  }

  componentDidLoad(): void {
    for (const controller of this.controllers) {
      controller.hostDidLoad?.();
    }
  }

  componentWillRender(): void {
    for (const controller of this.controllers) {
      controller.hostWillRender?.();
    }
  }

  componentDidRender(): void {
    for (const controller of this.controllers) {
      controller.hostDidRender?.();
    }
  }

  componentWillUpdate(): void {
    for (const controller of this.controllers) {
      controller.hostWillUpdate?.();
    }
  }

  componentDidUpdate(): void {
    for (const controller of this.controllers) {
      controller.hostDidUpdate?.();
    }
  }
}

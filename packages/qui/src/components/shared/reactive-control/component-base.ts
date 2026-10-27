import { type ReactiveController } from "./controller";

/**
 * Composition host for Stencil components. Extend it, add controllers, and
 * call `super.<lifecycle>()` from any override.
 */
export class ReactiveControlBase {
  private readonly controllers = new Set<ReactiveController>();
  private connected = false;

  public addController(controller: ReactiveController): void {
    if (this.controllers.has(controller)) {
      return;
    }
    this.controllers.add(controller);
    if (this.connected) {
      controller.hostConnected?.();
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

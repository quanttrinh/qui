import { forceUpdate, type MixedInCtor } from "@stencil/core";

import {
  type ReactiveController,
  type ReactiveControllerHost,
} from "../../controllers/reactive-controller";

interface ControllerHostElement {
  host: HTMLElement;
}

/* oxlint-disable typescript/method-signature-style -- Mixin instance members are methods so subclasses can override them. */
export interface ControllerHostMixinInstance extends ReactiveControllerHost {
  connectedCallback(): void;
  disconnectedCallback(): void;
  componentWillLoad(): void;
  componentDidLoad(): void;
  componentWillRender(): void;
  componentDidRender(): void;
  componentWillUpdate(): void;
  componentDidUpdate(): void;
}

/**
 * Mixin that forwards Stencil lifecycle hooks to registered controllers.
 *
 * Components can compose it with other behavior mixins:
 *
 * ```ts
 * class MyComponent extends Mixin(ControllerHostMixin, FormControlMixin) {}
 * ```
 */
const ControllerHostMixin = (Base: MixedInCtor): MixedInCtor<ControllerHostMixinInstance> =>
  class extends Base implements ReactiveControllerHost {
    private readonly controllers = new Set<ReactiveController>();
    private connected = false;

    get hostElement(): HTMLElement {
      // Stencil assigns the decorated `host` property on the component instance.
      // oxlint-disable-next-line typescript/no-unsafe-type-assertion
      return (this as unknown as ControllerHostElement).host;
    }

    addController(controller: ReactiveController): void {
      if (this.controllers.has(controller)) {
        return;
      }
      this.controllers.add(controller);
      if (this.connected) {
        controller.hostConnected?.();
      }
    }

    removeController(controller: ReactiveController): void {
      if (!this.controllers.delete(controller)) {
        return;
      }
      if (this.connected) {
        controller.hostDisconnected?.();
      }
    }

    requestUpdate(keys?: Iterable<string>): void {
      forceUpdate(this.hostElement);
      this.onRequestUpdate?.(keys);
    }

    notifyUpdate(keys?: Iterable<string>): void {
      if (this.onRequestUpdate === undefined) {
        forceUpdate(this.hostElement);
        return;
      }
      this.onRequestUpdate(keys);
    }

    /** Runs after a controller requests a render or notification. */
    protected onRequestUpdate?(keys?: Iterable<string>): void;

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
  };

export { ControllerHostMixin };

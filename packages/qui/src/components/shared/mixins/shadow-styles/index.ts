import { type MixedInCtor } from "@stencil/core";

import { ensureShadowStylesheet } from "../../../../utilities/styles";

/* oxlint-disable typescript/method-signature-style -- Mixin instance members are methods so subclasses can override them. */
export interface ShadowStylesMixinInstance {
  connectedCallback(): void;
}

/** Members the mixin reads from whatever class it is composed with. */
interface ShadowStylesBase {
  connectedCallback?(): void;
  host?: HTMLElement;
  hostElement?: HTMLElement;
}

/**
 * Mixin that links the shared stylesheet into the component's shadow root when
 * it connects.
 *
 * Compose it only for components that render styled content inside their
 * shadow root; host-only or data-only components simply leave it out.
 *
 * ```ts
 * class Styled extends Mixin(ShadowStylesMixin, ControllerHostMixin) {}
 * ```
 *
 * Place the mixin first: `Mixin` applies factories right-to-left, so the first
 * factory is the outermost class and its `connectedCallback` wins.
 */
const ShadowStylesMixin = (
  Base: MixedInCtor<ShadowStylesBase>,
): MixedInCtor<ShadowStylesMixinInstance> =>
  class extends Base {
    connectedCallback(): void {
      super.connectedCallback?.();
      const element = this.host ?? this.hostElement;
      if (element !== undefined) {
        ensureShadowStylesheet(element);
      }
    }
  };

export { ShadowStylesMixin };

import { type MixedInCtor } from "@stencil/core";

/* oxlint-disable typescript/method-signature-style -- Mixin instance members are methods so subclasses can override them. */
export interface ContextProviderMixinInstance {
  readonly hostElement: HTMLElement;
  componentShouldUpdate(newValue?: unknown, oldValue?: unknown, propName?: string): boolean;
}

/**
 * Mixin for provider roots whose props feed child context.
 *
 * Compose it with `ControllerHostMixin`, which provides `hostElement` and
 * `requestUpdate()`. Prop changes do not render a connected root by default:
 *
 * - Template-prop watchers call `requestUpdate()`.
 * - Context-only watchers notify the listener store directly.
 *
 * Every prop read by `render()` must be listed in a template-prop watcher.
 * Reflected props also depend on the render pass, so a root that skips renders
 * must reflect those attributes manually (see `qui-radio-group`'s `name`).
 *
 * Detached hosts use Stencil's normal update path so a template prop changed
 * while disconnected still renders when the host is updated again.
 */
const ContextProviderMixin = (Base: MixedInCtor): MixedInCtor<ContextProviderMixinInstance> =>
  class extends Base implements ContextProviderMixinInstance {
    declare readonly hostElement: HTMLElement;

    componentShouldUpdate(_newValue?: unknown, _oldValue?: unknown, _propName?: string): boolean {
      return !this.hostElement.isConnected;
    }
  };

export { ContextProviderMixin };

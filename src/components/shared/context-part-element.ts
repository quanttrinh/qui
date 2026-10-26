import { ensureShadowStylesheet } from "../../utilities/styles";
import { type ContextPart, type ContextPartSource } from "./context-part";

/**
 * Base class for components that consume an ancestor context.
 *
 * Subclasses keep their decorated `@Element() host` and `contextPart` members
 * and only override lifecycle hooks that add behavior beyond the context part.
 * Overrides should call `super` so the context lifecycle and shadow stylesheet
 * wiring keeps its original ordering.
 */
export abstract class ContextPartElement<TContext extends ContextPartSource> {
  protected abstract readonly host: HTMLElement;
  protected abstract readonly contextPart: ContextPart<TContext>;
  /** Host-only parts can opt out; their shadow root contains only a slot. */
  protected readonly needsShadowStyles: boolean = true;

  public connectedCallback(): void {
    this.contextPart.hostConnected();
    if (this.needsShadowStyles) {
      ensureShadowStylesheet(this.host);
    }
  }

  public componentWillLoad(): void {
    this.contextPart.hostWillLoad();
  }

  public componentDidLoad(): void {
    this.contextPart.hostDidLoad();
  }

  public disconnectedCallback(): void {
    this.contextPart.hostDisconnected();
  }
}

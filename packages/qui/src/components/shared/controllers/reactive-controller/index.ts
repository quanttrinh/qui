/**
 * The host contract a reactive controller talks to.
 *
 * `ControllerHostMixin` implements this for Stencil components, but any class
 * with these members can host controllers.
 */
export interface ReactiveControllerHost<TElement extends HTMLElement = HTMLElement> {
  /** The custom element instance that owns the controllers. */
  readonly hostElement: TElement;
  /** Registers a controller. */
  addController: (controller: ReactiveController) => void;
  /** Unregisters a controller. */
  removeController: (controller: ReactiveController) => void;
  /** Schedules a host render. */
  requestUpdate: () => void;
}

/** Lifecycle hooks a controller can observe on its host component. */
export interface ReactiveController {
  hostConnected?: () => void;
  hostDisconnected?: () => void;
  hostWillLoad?: () => void;
  hostDidLoad?: () => void;
  hostWillRender?: () => void;
  hostDidRender?: () => void;
  hostWillUpdate?: () => void;
  hostDidUpdate?: () => void;
}

/**
 * Base class for reactive controllers.
 *
 * Pass the component to the constructor and the controller registers itself,
 * mirroring Lit's reactive controller contract:
 *
 * ```ts
 * private readonly form = new FormController(this, { ... });
 * ```
 *
 * The host forwards its Stencil lifecycle to every registered controller, and
 * `requestUpdate()` schedules a render of the host.
 */
export abstract class ReactiveControllerBase<
  THost extends ReactiveControllerHost = ReactiveControllerHost,
> implements ReactiveController {
  protected readonly host: THost;

  /**
   * Type-only anchor. `ReactiveController` has only optional members, so
   * declaring one shared hook keeps `this` assignable when registering with
   * the host. Concrete controllers override the hooks they need.
   */
  hostConnected?(): void;

  constructor(host: THost) {
    this.host = host;
    host.addController(this);
  }

  /** The element that owns this controller. */
  protected get hostElement(): HTMLElement {
    return this.host.hostElement;
  }

  /** Schedules a render of the host component. */
  protected requestUpdate(): void {
    this.host.requestUpdate();
  }
}

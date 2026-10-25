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

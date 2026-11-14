# ReactiveControllerBase

Thin, Stencil-friendly implementation of the Lit-style reactive controller
contract: a controller receives its host, registers itself, and observes the
host's lifecycle.

## Role

Base class for every reactive controller in this package. No base class of its
own; it declares the host contract and implements the optional lifecycle hooks.

## Options

None.

## API

| Member                                                | Description                                                  |
| ----------------------------------------------------- | ------------------------------------------------------------ |
| `ReactiveControllerHost.hostElement`                  | The custom element that owns the controllers                 |
| `ReactiveControllerHost.addController(controller)`    | Registers a controller; connects it if the host is connected |
| `ReactiveControllerHost.removeController(controller)` | Unregisters a controller; disconnects it if connected        |
| `ReactiveControllerHost.requestUpdate(keys?)`         | Schedules a host render; `keys` scopes context notifications |
| `ReactiveControllerHost.notifyUpdate?(keys?)`         | Notifies context subscribers without rendering               |
| `ReactiveController`                                  | Optional host lifecycle hooks                                |
| `host` (protected)                                    | The host instance                                            |
| `hostElement` (protected getter)                      | `host.hostElement`                                           |
| `requestUpdate(keys?)` (protected)                    | Delegates to `host.requestUpdate`                            |
| `requestNotify(keys?)` (protected)                    | Uses `host.notifyUpdate`, falling back to `requestUpdate`    |

## Lifecycle

- `hostConnected` — host's `connectedCallback`.
- `hostDisconnected` — host's `disconnectedCallback`.
- `hostWillLoad` — host's `componentWillLoad`.
- `hostDidLoad` — host's `componentDidLoad`.
- `hostWillRender` — host's `componentWillRender`.
- `hostDidRender` — host's `componentDidRender`.
- `hostWillUpdate` — host's `componentWillUpdate`.
- `hostDidUpdate` — host's `componentDidUpdate`.

## Notes

- Controllers are registered in their constructor; components only declare the
  field.
- `requestUpdate` renders through `forceUpdate`, so it bypasses Stencil's
  `componentShouldUpdate`. Use it only for state the host template reads.
- `requestNotify` is for context providers whose root template is prop-only.
- `hostConnected?()` is declared on the base as a type anchor because all
  `ReactiveController` members are optional; this keeps `this` assignable when
  registering.
- Hosts other than Stencil components only need to implement the host contract;
  `notifyUpdate` is optional for compatibility with simple test fakes.

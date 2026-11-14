# Reactive controllers

This folder contains the shared controller toolkit used by every `qui-*`
component. Controllers own behavior that is not tied to a single render: state
machines, registries, form integration, keyboard navigation, and context
subscriptions. Components stay thin and forward their Stencil lifecycle once
through `ControllerHostMixin`.

## The contract

Every controller is constructed with its host component and registers itself:

```ts
export class QuiExample extends Mixin(ControllerHostMixin) {
    @Element() host!: HTMLQuiExampleElement;

    private readonly form = new FormController(this, {
        getInternals: () => this.internals,
        // ...
    });
}
```

The host implements `ReactiveControllerHost` and forwards these Stencil hooks
to every registered controller:

| Hook               | When                   |
| ------------------ | ---------------------- |
| `hostConnected`    | `connectedCallback`    |
| `hostDisconnected` | `disconnectedCallback` |
| `hostWillLoad`     | `componentWillLoad`    |
| `hostDidLoad`      | `componentDidLoad`     |
| `hostWillRender`   | `componentWillRender`  |
| `hostDidRender`    | `componentDidRender`   |
| `hostWillUpdate`   | `componentWillUpdate`  |
| `hostDidUpdate`    | `componentDidUpdate`   |

Controllers can request work in two ways:

- `requestUpdate()` — renders the host and notifies context subscribers.
- `requestNotify(keys?)` — notifies context subscribers **without** rendering
  the host. Used by components whose root template only reads props.

Both accept optional key sets so context notifications can be scoped to the
affected values instead of waking every part of a widget.

## Controllers

| Folder                                                           | Responsibility                                           |
| ---------------------------------------------------------------- | -------------------------------------------------------- |
| [`reactive-controller`](./reactive-controller/README.md)         | Host contract, lifecycle hooks, base class               |
| [`controlled-controller`](./controlled-controller/README.md)     | Controlled/uncontrolled value state                      |
| [`checkable-controller`](./checkable-controller/README.md)       | Checked/indeterminate state for checkbox-like controls   |
| [`context-part-controller`](./context-part-controller/README.md) | Discover a provider, subscribe, retry on late providers  |
| [`field-controller`](./field-controller/README.md)               | Provider side of `qui-field`                             |
| [`field-part-controller`](./field-part-controller/README.md)     | Label/helper/error/required parts of a field             |
| [`form-controller`](./form-controller/README.md)                 | Form value, validity, reset, restore, field integration  |
| [`list-window-controller`](./list-window-controller/README.md)   | Virtualized/overflow list measurement and windows        |
| [`option`](./option/README.md)                                   | Shared select/combobox selection, navigation, and source |

## Support utilities

These live here because the controllers depend on them, but they are not
reactive controllers themselves:

| Folder                                                           | Responsibility                                                 |
| ---------------------------------------------------------------- | -------------------------------------------------------------- |
| [`focus-state`](./focus-state/README.md)                         | Focused value, focus-within, focus-visible bookkeeping         |
| [`keyed-host-registry`](./keyed-host-registry/README.md)         | Value-keyed registration registry with scoped change callbacks |
| [`listener-store`](./listener-store/README.md)                   | Keyed set of change listeners used by context providers        |
| [`registration-reconciler`](./registration-reconciler/README.md) | Re-run a registration only when its signature changes          |
| [`roving-focus`](./roving-focus/README.md)                       | Roving-focus registries, index movement, and edge handling     |

## Component-owned controllers

Some controllers are specific to one component and live beside it:

- [`qui-accordion/controller.ts`](../../qui-accordion/controller.md)
- [`qui-tabs/controller.ts`](../../qui-tabs/controller.md)
- [`qui-radio/controller.ts`](../../qui-radio/controller.md)
- [`qui-combobox/input-controller.ts`](../../qui-combobox/input-controller.md)

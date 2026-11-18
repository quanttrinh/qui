# Context

Event-based data passing from an ancestor to descendants, following the
[Web Components CG context protocol](https://github.com/webcomponents-cg/community-protocols/blob/main/proposals/context.md).

## Role

Shared infrastructure for the six context families: field, tabs, radio group,
dialog, accordion, and accordion item. A provider answers `context-request`
events on its host; a part dispatches the event and receives a value through a
callback. No ancestor walk, shadow-root bridging, or value-level `subscribe`
method is needed — the browser's bubbling/composed events do that work.

## API

Public exports (package root):

| Member                             | Description                                                     |
| ---------------------------------- | --------------------------------------------------------------- |
| `createContext<Value>()`           | Creates a unique typed key; an explicit key enables interop      |
| `provideContext(host, key, value)` | Publishes a value; returns a `ContextProviderHandle`             |
| `consumeOnce(host, key)`           | Synchronous one-shot read for imperative consumers               |
| `ContextProviderHandle`            | `setValue(value)`, `notify()`, `clear()`                          |
| `ContextPartController`            | Part-side controller (from the controllers entry)                 |
| `Context`, `ContextType`, `ContextCallback`, `ContextPartOptions` | Types for keys, callbacks, and parts         |

Internal exports (used by controllers and family modules): `requestContext`,
`notifyContext`, `clearContext`, and the event factories.

Each family defines a key and thin wrappers in its own `context.ts`, e.g.
`fieldContext` with `provideField(host, field)` / `clearField(host)`.

## Protocol

| Event              | Fired by | Fields                                              |
| ------------------ | -------- | --------------------------------------------------- |
| `context-request`  | Consumer | `context`, `callback`, `subscribe`, `contextTarget`  |
| `context-provider` | Provider | `context`, `contextTarget`, `available`             |

Both events bubble and are composed. Matching is strict equality on the key.
A provider calls `stopImmediatePropagation()` before invoking the callback so
only the nearest ancestor answers. When `subscribe` is true the callback may be
called again; the provider passes an `unsubscribe` function as the callback's
second argument. A provider must not retain callbacks from one-shot requests.
Subscription callbacks and consumer hosts are held through `WeakRef`s and
pruned during notification, so a consumer that forgets to unsubscribe cannot
keep the provider from collecting it.

`context-provider` is a compatible extension used for late providers: a
document-level coordinator caches requests with `WeakRef`s and re-dispatches
them when a provider announces itself. A request is removed from that cache as
soon as a provider answers it, so later announcements do not re-deliver it.
`clearContext` also announces `available: false` and invokes callbacks with
`undefined` to invalidate consumers.

Repeated requests with the same callback (for example when a pending request is
re-dispatched) reuse the existing subscription instead of replacing it, so an
older `unsubscribe` cannot remove a newer subscription.

## Usage

Provider root:

```ts
private provider?: ContextProviderHandle<MyContext>;

connectedCallback(): void {
  this.provider = provideContext(this.host, myContext, this.context);
}

@Watch("value")
private syncContext(): void {
  this.provider?.notify();
}

disconnectedCallback(): void {
  this.provider?.clear();
}
```

Part component:

```ts
private readonly part = new ContextPartController(this, {
  context: myContext,
  select: (ctx) => ctx.value(),
});

render(): VNode {
  return <div>{this.part.context?.value()}</div>;
}
```

## Lifecycle

- Provider attaches its listener in `componentWillLoad` / `connectedCallback`
  and removes it in `disconnectedCallback`.
- Part dispatches its request in `hostWillLoad` (silent) or `hostConnected`;
  `hostDisconnected` unsubscribes and runs the `setup` teardown.
- Requests are synchronous: a connected provider answers during `dispatchEvent`.
- A late provider answers cached requests through the `context-provider` event;
  no extra retry hook is needed on the part.

## Notes

- The event constructor is resolved from the host's document, so the same code
  works in browsers and in Stencil's hydrate DOM (mock-doc).
- Stencil coalesces renders, so provider notifications do not need a custom
  microtask batch. Parts can further filter updates with `select` / `equals`.
- `ContextPartController.onNotify` forwards every notification, including ones
  filtered by `select`, so nested providers (e.g. accordion items) can wake
  their own subscribers.
- Context keys are plain values; the `__context__` property is a type-only
  brand and never exists at runtime.

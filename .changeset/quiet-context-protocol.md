---
"@quanttrinh/qui": minor
---

Rewrite the internal context system around the Web Components Community Group `context-request` event protocol.

Context now propagates through composed, bubbling DOM events instead of a WeakMap ancestor walk. Providers attach a `context-request` listener and answer the nearest request with `stopImmediatePropagation()`; parts subscribe through `ContextPartController` and receive synchronous values with unsubscribe callbacks. A document-level coordinator re-dispatches pending requests when a provider appears late and falls back to a more distant provider when one is cleared.

Context value objects no longer expose `subscribe`. Providers keep a handle from `provideContext()` with `setValue`, `notify`, and `clear`. `createContext()` generates a unique symbol key by default. `ContextPartController`, `createContext`, `provideContext`, `consumeOnce`, and their types are now exported from the package root.

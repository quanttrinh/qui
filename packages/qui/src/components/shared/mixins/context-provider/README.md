# ContextProviderMixin

Makes a context provider root render on demand.

## Role

Stencil mixin. Must be composed with `ControllerHostMixin`.

```ts
class MyProvider extends Mixin(ControllerHostMixin, ContextProviderMixin) {}
```

## Behavior

Connected provider roots do not render on prop changes by default.
`componentShouldUpdate` returns `false`, so watchers choose whether a change
renders:

```ts
// Props read by render().
@Watch("orientation")
@Watch("variant")
private renderRoot(): void {
  this.requestUpdate();
}

// Props that only feed controllers or child context.
@Watch("value")
private syncContext(): void {
  this.listeners.notify();
}
```

Detached hosts return `true` from `componentShouldUpdate` so Stencil's normal
update path can still render a prop changed while disconnected.

## Checklist

When adding a prop to a provider:

1. If `render()` reads it, add it to a `renderRoot` watcher.
2. Otherwise, add it to a context watcher and notify the listener store.
3. If it uses `reflect: true` and is context-only, reflect the attribute
   manually. Stencil reflects during the render pass, which these roots skip.

## Notes

- `ContextProviderMixin` requires `ControllerHostMixin` for `hostElement` and
  `requestUpdate`.
- Do not override `componentShouldUpdate` with a narrower signature; the mixin
  mirrors Stencil's three optional arguments.
- The listener-store notification is deliberate; `notifyUpdate()` is equivalent
  but calling the store directly keeps the watcher contract explicit.

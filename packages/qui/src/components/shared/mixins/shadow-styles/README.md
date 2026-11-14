# ShadowStylesMixin

Links the shared qui stylesheet into a component's shadow root when it
connects.

## Role

Composition mixin. Applies to any Stencil component, with or without
`ControllerHostMixin`, and forwards the previous `connectedCallback` before
adding the stylesheet link.

## Usage

```ts
@Component({ tag: "qui-example", shadow: true })
export class QuiExample extends Mixin(ShadowStylesMixin, ControllerHostMixin) {}
```

Only compose the mixin for components that render styled content inside their
shadow root. Host-only and data-only components — for example `qui-option`,
`qui-dialog`, and the field helper/error/required text — simply leave it out.

Place the mixin **first**: `Mixin` applies factories right-to-left, so the first
factory is the outermost class and its `connectedCallback` wins.

The mixin resolves the host from the `@Element()` `host` property, falling back
to `hostElement` from `ControllerHostMixin`.

## Notes

- The link is added by `ensureShadowStylesheet()`, which is SSR-safe and a
  no-op when the component has no shadow root.
- Because the mixin calls the previous `connectedCallback`, a component that
  defines its own must call `super.connectedCallback()`.

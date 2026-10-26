---
"@quanttrinh/qui": patch
---

Document the SSR streaming behavior.

Stencil's `streamToString()` currently fully renders and buffers the document
before yielding a single chunk. `withShadowStylesheet()` works with that API,
but `renderToString()` remains the recommended path when diagnostics are
needed. Added coverage for the buffered streaming path.

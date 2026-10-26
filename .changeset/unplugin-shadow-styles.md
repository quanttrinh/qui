---
"@quanttrinh/qui": minor
---

Make the unplugin configure shadow-root styles automatically.

The generated `virtual:qui/styles` module now preserves an existing marked app
stylesheet. When no stylesheet is configured, it creates one shared URL for the
document and shadow roots instead of requiring a manual
`link[data-qui-styles]`.

Use `styles: false` to keep full control of the combined app stylesheet or when
a strict CSP blocks `blob:` stylesheets.

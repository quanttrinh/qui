---
"@quanttrinh/qui": minor
---

Make the unplugin configure shadow-root styles automatically.

The generated `virtual:qui/styles` module now preserves an existing marked app
stylesheet. When no stylesheet is configured, it creates one shared URL for the
document and shadow roots instead of requiring a manual
`link[data-qui-styles]`.

Registration output is sorted alphabetically. Context parts retry when a
provider is defined or upgraded later, so the plugin no longer maintains a
separate provider-priority table. Use `styles: false` to keep full control of
the combined app stylesheet or when a strict CSP blocks `blob:` stylesheets. HMR disposal removes the generated link
and clears the runtime URL before the next module instance loads.

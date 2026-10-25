---
"@quanttrinh/qui": minor
---

Upgrade the auto-registration plugin to `unplugin` v3.

- Update `unplugin` from `^2.3.11` to `^3.4.0`.
- Require Node.js `^20.19.0 || >=22.12.0`, matching unplugin v3's ESM-only
  support matrix.
- Keep AST extraction on Oxc; the plugin does not use unplugin's optional
  `this.parse` helper, so v3's removal of the bundled Acorn parser does not
  change tag detection.

---
"@quanttrinh/qui": patch
---

Enable the full Panda CSS lint ruleset and normalize component styles around its conventions. Styles now use token-backed values, shorthand properties, logical spacing, and shared text styles, and the public `qui-icon` and internal icon helpers share one SVG renderer while internal icons stay as lightweight VNodes.

Move the package build tooling from `build/` to `tooling/` and keep the shared lint configuration in each package.

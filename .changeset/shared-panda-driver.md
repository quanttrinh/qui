---
"@quanttrinh/qui": patch
---

Share one Panda driver across stylesheet generation and source transforms.

- Reuse a single main Panda compiler for `styles.css` and
  `@pandacss/transformer`.
- Generate `theme.css` with a dedicated theme driver.
- Keep the synchronous codegen bootstrap required by Stencil, then use the
  shared driver for CSS and watch updates.
- Remove the unused Panda Rollup CSS asset and repeated `panda cssgen`
  subprocesses.

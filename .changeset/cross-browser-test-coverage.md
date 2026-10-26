---
"@quanttrinh/qui": patch
---

Expand browser coverage for the Shadow DOM release.

- Run SSR/hydration smoke tests in Chromium, Firefox, and WebKit.
- Assert Chromium accessibility-tree output and cross-browser role/name lookup
  for buttons, labelled icons, and icon-only buttons.
- Cover tabs and accordion relationships in the cross-browser smoke suite,
  accepting either ARIA element reflection or the IDREF fallback.
- Verify declarative shadow DOM styling, link retention, and hydration without
  fixed timing sleeps.

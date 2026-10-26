---
"@quanttrinh/qui": patch
---

Expand browser coverage for the Shadow DOM release.

- Run SSR/hydration smoke tests in Chromium, Firefox, and WebKit.
- Assert Chromium accessibility-tree output for buttons and cross-shadow-root
  field labels and descriptions.
- Verify declarative shadow DOM styling, link retention, and hydration without
  fixed timing sleeps.

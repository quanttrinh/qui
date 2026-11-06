---
"@quanttrinh/qui": minor
"@quanttrinh/qui-unplugin": patch
---

Reorganize the build pipeline around a shared build config and async build helpers. Utility, theme, and style modules now expose focused entry points, Stencil output targets are gated for test and dev builds, and production type finalization runs automatically after the build.

Replace component controller base classes with composable mixins (`ControllerHostMixin`, `FormControlMixin`, and `OptionControlMixin`), and extract dedicated field and field-part controllers. The public `ControllerHostBase` export is replaced by these mixins.

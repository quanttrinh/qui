---
"@quanttrinh/qui": minor
"@quanttrinh/qui-unplugin": patch
---

Reorganize the build pipeline around a shared build config and async build helpers. Utility, theme, and style modules now expose focused entry points, Stencil output targets are gated for test and dev builds, and production type finalization runs automatically after the build.

Replace component controller base classes with composable mixins (`ControllerHostMixin`, `FormControlMixin`, and `OptionControlMixin`), and extract dedicated field and field-part controllers. The public `ControllerHostBase` export is replaced by these mixins.

Replace `qui-field`'s `elementIds` object prop with simple string props: `rootId`, `controlId`, `labelId`, `errorTextId`, and `helperTextId`. This makes every field id override usable as an HTML attribute and in SSR markup.

Remove the function variant from `qui-popover`'s `anchor` prop. It now accepts only an `HTMLElement`; the previous sibling remains the default.

Mark complex props as property-only with `attribute: null`: `items`, `optionRender`, `value`, and `defaultValue` on select/combobox, `value` and `defaultValue` on accordion, `filter` on combobox, and `anchor` on popover. Setting these through HTML attributes previously assigned a string to an array/object/function prop.

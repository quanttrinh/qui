---
"@quanttrinh/qui": patch
---

Hide composite component content in the global stylesheet until the custom
elements are registered, preventing a flash of undefined light-DOM content
before Stencil injects its hydrated styles.

The rule only targets content that has no usable pre-upgrade state, uses
`:not(:defined)` so it stops applying after registration, and excludes
server-rendered hosts carrying Stencil's `hydrated` class. It is `!important`
while undefined so consumer host `display` styles cannot re-expose the content.
If the client bundle never loads, the affected content remains hidden.

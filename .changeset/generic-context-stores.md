---
"@quanttrinh/qui": patch
---

Refactor internal context providers into independent generic context stores. Context families no longer share a hardcoded component key union, and parts consume a context store directly.

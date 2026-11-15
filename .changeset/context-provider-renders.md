---
"@quanttrinh/qui": patch
---

Refactor context provider roots to notify subscribers without scheduling a root render, and drop the per-component context-only prop sets. Template props opt into renders through watchers.

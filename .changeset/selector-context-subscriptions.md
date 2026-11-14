---
"@quanttrinh/qui": minor
---

Refactor internal context notifications to use per-part selector snapshots. Providers notify without computing changed key sets, and parts skip re-renders when the context values they use are unchanged. The exported controller `requestUpdate`/`notifyUpdate` signatures no longer accept key sets.

---
"@quanttrinh/qui": patch
---

Make dialog scroll locking reference-counted.

Multiple open modal dialogs now share a lock count, and scrolling is restored
only when the last modal dialog closes or disconnects. Changing `modal` or
`preventScroll` while a dialog is open also updates the native modality,
document listeners, and scroll lock state. Queued close events from the
modality switch are ignored once the dialog has reopened.

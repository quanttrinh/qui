---
"@quanttrinh/solid-md3": minor
---

Add a Vite build pipeline that emits compiled JavaScript and styles (`dist/index.js`, `dist/styles.css`) plus TypeScript declarations, and add a `solid` export condition so Solid apps can compile the component source in their own build. Package entry points now resolve to `dist` instead of `src`.

Make `solid-js` a required peer dependency instead of optional, since it is the library's core runtime.

Update all dev and peer dependencies to their latest versions.

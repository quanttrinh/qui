/** Content hosts that have no useful pre-upgrade state. */
export const UNDEFINED_CONTENT_TAGS = [
  "qui-popover",
  "qui-select",
  "qui-combobox",
  "qui-dialog-content",
  "qui-tab-panel",
  "qui-accordion-content",
] as const;

/**
 * Suppresses content while its custom element is undefined, but keeps
 * server-rendered hosts visible through Stencil's `hydrated` marker.
 */
export const UNDEFINED_CONTENT_SELECTOR = `:where(${UNDEFINED_CONTENT_TAGS.join(
  ", ",
)}):not(:defined):not(.hydrated)`;

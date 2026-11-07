import { UNDEFINED_CONTENT_TAGS } from "./generated/undefined-content-tags";

/**
 * Suppresses content while its custom element is undefined, but keeps
 * server-rendered hosts visible through Stencil's `hydrated` marker.
 */
function undefinedContentSelector(tags: readonly string[] = UNDEFINED_CONTENT_TAGS): string {
  const selector = tags.length === 0 ? ":where(:not(*))" : `:where(${tags.join(", ")})`;
  return `${selector}:not(:defined):not(.hydrated)`;
}

export { undefinedContentSelector };

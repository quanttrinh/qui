const locks = new WeakMap<Document, number>();

/**
 * Locks document scrolling and returns an idempotent release function.
 *
 * Multiple modal surfaces can be open at once, so the lock is reference-counted
 * and only removed when the last owner releases it.
 */
export function lockDocumentScroll(document: Document): () => void {
  locks.set(document, (locks.get(document) ?? 0) + 1);
  document.documentElement.dataset.quiScrollLocked = "";

  let active = true;
  return (): void => {
    if (!active) {
      return;
    }
    active = false;
    const remaining = (locks.get(document) ?? 1) - 1;
    if (remaining <= 0) {
      locks.delete(document);
      delete document.documentElement.dataset.quiScrollLocked;
      return;
    }
    locks.set(document, remaining);
  };
}

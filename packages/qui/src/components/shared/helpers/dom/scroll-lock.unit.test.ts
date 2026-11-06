import { describe, expect, it } from "vitest";

import { lockDocumentScroll } from "./scroll-lock";

function fakeDocument(): Document {
  return {
    documentElement: { dataset: {} },
  } as unknown as Document;
}

describe("lockDocumentScroll", () => {
  it("keeps the lock until the last owner releases it", () => {
    const document = fakeDocument();
    const releaseFirst = lockDocumentScroll(document);
    const releaseSecond = lockDocumentScroll(document);

    expect(document.documentElement.dataset.quiScrollLocked).toBe("");
    releaseFirst();
    expect(document.documentElement.dataset.quiScrollLocked).toBe("");
    releaseSecond();
    expect(document.documentElement.dataset.quiScrollLocked).toBeUndefined();
  });

  it("ignores repeated releases", () => {
    const document = fakeDocument();
    const release = lockDocumentScroll(document);

    release();
    release();

    expect(document.documentElement.dataset.quiScrollLocked).toBeUndefined();
  });
});

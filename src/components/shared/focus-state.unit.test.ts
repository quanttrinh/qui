import { describe, expect, it } from "vitest";

import { FocusState } from "./focus-state";

describe("FocusState", () => {
  it("tracks the focused value without marking focus-within by default", () => {
    const state = new FocusState();

    expect(state.focus("one")).toBe(true);
    expect(state.focusedValue).toBe("one");
    expect(state.hasFocus).toBe(false);
    expect(state.focus("one")).toBe(false);
  });

  it("tracks focus-within for composite widgets", () => {
    const state = new FocusState();

    expect(state.focus("one", true)).toBe(true);
    expect(state.hasFocus).toBe(true);
    expect(state.focus("one", true)).toBe(false);

    expect(state.blur()).toBe(true);
    expect(state.focusedValue).toBeUndefined();
    expect(state.hasFocus).toBe(false);
    expect(state.blur()).toBe(false);
  });

  it("restores an initial focused value without focus-within", () => {
    const state = new FocusState();
    state.focus("one", true);

    state.reset("two");

    expect(state.focusedValue).toBe("two");
    expect(state.hasFocus).toBe(false);
  });
});

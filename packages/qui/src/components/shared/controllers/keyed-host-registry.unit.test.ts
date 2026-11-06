import { describe, expect, it, vi } from "vitest";

import { KeyedHostRegistry } from "./keyed-host-registry";

interface Entry {
  id: string;
  host: string;
}

function entry(id: string, host = id): Entry {
  return { id, host };
}

function sameHost(existing: Entry, next: Entry): boolean {
  return existing.host === next.host;
}

describe("KeyedHostRegistry", () => {
  it("tracks entries by key in registration order", () => {
    const registry = new KeyedHostRegistry<Entry>();
    const first = entry("one");
    const second = entry("two");

    registry.register("one", first);
    registry.register("two", second);

    expect(registry.get("one")).toBe(first);
    expect(registry.get("two")).toBe(second);
    expect(registry.values()).toEqual([first, second]);
  });

  it("keeps an existing key's position when its entry is replaced", () => {
    const registry = new KeyedHostRegistry<Entry>();
    const first = entry("one");
    const second = entry("two");
    const replacement = entry("one", "replacement");

    registry.register("one", first);
    registry.register("two", second);
    registry.register("one", replacement);

    expect(registry.values()).toEqual([replacement, second]);
  });

  it("treats an equivalent re-registration as a no-op", () => {
    const registry = new KeyedHostRegistry<Entry>({ onChange: vi.fn((): void => undefined) });
    const first = entry("one");
    const unregister = registry.register("one", first, sameHost);

    const duplicateUnregister = registry.register("one", entry("one"), sameHost);
    duplicateUnregister();

    expect(registry.get("one")).toBe(first);
    unregister();
    expect(registry.get("one")).toBeUndefined();
  });

  it("returns an idempotent unregister and ignores stale teardown", () => {
    const registry = new KeyedHostRegistry<Entry>();
    const first = entry("one");
    const replacement = entry("one", "replacement");
    const unregisterFirst = registry.register("one", first);
    const unregisterReplacement = registry.register("one", replacement);

    unregisterFirst();
    unregisterFirst();

    expect(registry.get("one")).toBe(replacement);

    unregisterReplacement();
    unregisterReplacement();
    expect(registry.get("one")).toBeUndefined();
  });

  it("notifies only when the contents actually change", () => {
    const onChange = vi.fn((): void => undefined);
    const registry = new KeyedHostRegistry<Entry>({ onChange });
    const value = entry("one");
    const unregister = registry.register("one", value);

    expect(onChange).toHaveBeenCalledOnce();
    registry.register("one", value);
    expect(onChange).toHaveBeenCalledOnce();

    unregister();
    expect(onChange).toHaveBeenCalledTimes(2);
    unregister();
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it("clears every entry and notifies once", () => {
    const onChange = vi.fn((): void => undefined);
    const registry = new KeyedHostRegistry<Entry>({ onChange });
    registry.register("one", entry("one"));
    registry.register("two", entry("two"));
    onChange.mockClear();

    registry.clear();
    registry.clear();

    expect(registry.values()).toEqual([]);
    expect(onChange).toHaveBeenCalledOnce();
  });
});

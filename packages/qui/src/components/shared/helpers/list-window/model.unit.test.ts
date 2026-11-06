import { describe, expect, it } from "vitest";

import { ListMetrics } from "./model";

const items = Array.from({ length: 100 }, (_item, index) => index);

describe("ListMetrics", () => {
  it("builds a virtualized window with overscan", () => {
    const metrics = new ListMetrics({ estimate: 10 });
    const window = metrics.window({
      items,
      mode: "virtualize",
      viewportSize: 50,
      scrollOffset: 0,
      overscan: 1,
    });

    expect(window.total).toBe(100);
    expect(window.totalSize).toBe(1000);
    expect(window.offset).toBe(0);
    expect(window.entries.map((entry) => entry.index)).toEqual([0, 1, 2, 3, 4, 5]);
    expect(window.overflow).toEqual([]);
  });

  it("moves the window with the scroll offset", () => {
    const metrics = new ListMetrics({ estimate: 10 });
    const window = metrics.window({
      items,
      mode: "virtualize",
      viewportSize: 50,
      scrollOffset: 100,
      overscan: 0,
    });

    expect(window.offset).toBe(100);
    expect(window.entries.map((entry) => entry.index)).toEqual([10, 11, 12, 13, 14]);
  });

  it("uses measured rows over the estimate", () => {
    const metrics = new ListMetrics({ estimate: 10 });
    metrics.window({ items, mode: "virtualize", viewportSize: 10 });
    expect(metrics.setSize(0, 20)).toBe(true);
    expect(metrics.setSize(0, 20)).toBe(false);
    const window = metrics.window({
      items,
      mode: "virtualize",
      viewportSize: 50,
      scrollOffset: 0,
      overscan: 0,
    });

    expect(window.totalSize).toBe(1010);
    expect(window.entries.map((entry) => entry.index)).toEqual([0, 1, 2, 3]);
  });

  it("updates the estimate and rebuilds offsets", () => {
    const metrics = new ListMetrics({ estimate: 10 });
    expect(metrics.setEstimate(10)).toBe(false);
    expect(metrics.setEstimate(20)).toBe(true);
    const window = metrics.window({
      items,
      mode: "virtualize",
      viewportSize: 40,
      scrollOffset: 0,
      overscan: 0,
    });

    expect(window.totalSize).toBe(2000);
    expect(window.entries.map((entry) => entry.index)).toEqual([0, 1]);
  });

  it("reveals rows above and below the viewport", () => {
    const metrics = new ListMetrics({ estimate: 10 });
    metrics.window({ items, mode: "virtualize", viewportSize: 10 });
    expect(metrics.reveal({ index: 0, scrollOffset: 50, viewportSize: 20 })).toBe(0);
    expect(metrics.reveal({ index: 20, scrollOffset: 0, viewportSize: 50 })).toBe(160);
    expect(metrics.reveal({ index: 2, scrollOffset: 0, viewportSize: 50 })).toBeUndefined();
  });

  it("splits overflowing items from the visible items", () => {
    const metrics = new ListMetrics({ estimate: 10 });
    const window = metrics.window({
      items: items.slice(0, 10),
      mode: "overflow",
      viewportSize: 45,
      reserveSize: 10,
    });

    expect(window.entries.map((entry) => entry.index)).toEqual([0, 1, 2]);
    expect(window.offset).toBe(0);
    expect(window.totalSize).toBe(30);
    expect(window.overflow).toEqual([3, 4, 5, 6, 7, 8, 9]);
  });

  it("returns an empty window for no items", () => {
    const metrics = new ListMetrics({ estimate: 10 });
    expect(metrics.window({ items: [], mode: "virtualize", viewportSize: 50 })).toEqual({
      total: 0,
      entries: [],
      overflow: [],
      offset: 0,
      totalSize: 0,
    });
  });
});

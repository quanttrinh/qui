import { beforeEach, describe, expect, it, vi } from "vitest";

import { resolveStylesheetPath } from "./resolve-styles";

const { pluginResolve, cwdResolve } = vi.hoisted(() => ({
  pluginResolve: vi.fn(),
  cwdResolve: vi.fn(),
}));

vi.mock("node:module", () => {
  let calls = 0;
  return {
    createRequire: vi.fn(() => {
      calls += 1;
      return { resolve: calls === 1 ? pluginResolve : cwdResolve };
    }),
  };
});

const fail = (): never => {
  throw new Error("missing");
};

describe("resolveStylesheetPath", () => {
  beforeEach(() => {
    pluginResolve.mockReset();
    cwdResolve.mockReset();
  });

  it("uses the plugin resolver first", () => {
    pluginResolve.mockReturnValue("/plugin/styles.css");

    expect(resolveStylesheetPath()).toBe("/plugin/styles.css");
    expect(cwdResolve).not.toHaveBeenCalled();
  });

  it("falls back to the workspace resolver", () => {
    pluginResolve.mockImplementation(fail);
    cwdResolve.mockReturnValue("/cwd/styles.css");

    expect(resolveStylesheetPath()).toBe("/cwd/styles.css");
  });

  it("throws a helpful error with the last cause when both resolvers fail", () => {
    pluginResolve.mockImplementation(fail);
    cwdResolve.mockImplementation(fail);

    try {
      resolveStylesheetPath();
      expect.unreachable("Expected resolution to fail");
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toBe(
        "@quanttrinh/qui-unplugin requires @quanttrinh/qui to be installed alongside it.",
      );
      expect((error as Error).cause).toBeInstanceOf(Error);
    }
  });
});

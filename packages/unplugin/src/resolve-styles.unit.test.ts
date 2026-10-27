import { describe, expect, it } from "vitest";

import { resolveStylesheetPath } from "./resolve-styles";

const fail = (): string => {
  throw new Error("missing");
};

describe("resolveStylesheetPath", () => {
  it("uses the plugin resolver first", () => {
    expect(
      resolveStylesheetPath(
        () => "/plugin/styles.css",
        () => "/cwd/styles.css",
      ),
    ).toBe("/plugin/styles.css");
  });

  it("falls back to the workspace resolver", () => {
    expect(resolveStylesheetPath(fail, () => "/cwd/styles.css")).toBe("/cwd/styles.css");
  });

  it("throws a helpful error when both resolvers fail", () => {
    expect(() => resolveStylesheetPath(fail, fail)).toThrow(
      "@quanttrinh/qui-unplugin requires @quanttrinh/qui to be installed alongside it.",
    );
  });
});

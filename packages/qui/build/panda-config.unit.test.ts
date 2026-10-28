import { describe, expect, it, vi } from "vitest";

import { quiPreset } from "../panda.config";
import { UNDEFINED_CONTENT_SELECTOR, UNDEFINED_CONTENT_TAGS } from "./undefined-content";

vi.mock("@pandacss/dev", () => ({
  defineConfig: <Config>(config: Config) => config,
}));

describe("quiPreset global CSS", () => {
  it("hides only undefined content hosts", () => {
    expect(quiPreset.globalCss).toMatchObject({
      [UNDEFINED_CONTENT_SELECTOR]: {
        display: "none !important",
      },
    });
    expect(UNDEFINED_CONTENT_SELECTOR).toContain(":not(:defined)");
    expect(UNDEFINED_CONTENT_SELECTOR).toContain(":not(.hydrated)");

    const tags = [...UNDEFINED_CONTENT_SELECTOR.matchAll(/qui-[a-z-]+/gu)].map((match) => match[0]);
    expect(tags).toEqual([...UNDEFINED_CONTENT_TAGS]);
  });
});

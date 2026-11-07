import { beforeAll, describe, expect, it, vi } from "vitest";

import { quiPreset } from "../../panda.config";
import { createConfig } from "../config";
import { componentDeclarationsFromSource } from "./component-tags";
import { UNDEFINED_CONTENT_TAGS } from "./generated/undefined-content-tags";
import { undefinedContentSelector } from "./undefined-content";
import { undefinedContentTagsFromSource } from "./undefined-content-scan";

const build = createConfig(process.cwd());
let SOURCE_TAGS: string[] = [];
const UNDEFINED_CONTENT_SELECTOR = undefinedContentSelector();

beforeAll(async () => {
  SOURCE_TAGS = await undefinedContentTagsFromSource(build);
});

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
    expect(tags).toEqual(SOURCE_TAGS);
  });

  it("keeps the generated tag module in sync with the source markers", () => {
    expect(UNDEFINED_CONTENT_TAGS).toEqual(SOURCE_TAGS);
    expect(SOURCE_TAGS).toEqual(
      expect.arrayContaining(["qui-dialog-content", "qui-select", "qui-tab-panel"]),
    );
  });
});

describe("component declarations", () => {
  it("scopes the undefined-content marker to the documented component", () => {
    const declarations = componentDeclarationsFromSource(`
      /** @undefinedContent */
      @Component({ tag: "qui-one" })
      export class One {}

      /** Regular content. */
      @Component({ tag: "qui-two" })
      export class Two {}

      @Component({ tag: "qui-three" })
      export class Three {}
    `);

    expect(declarations).toEqual([
      { tag: "qui-one", undefinedContent: true },
      { tag: "qui-two", undefinedContent: false },
      { tag: "qui-three", undefinedContent: false },
    ]);
  });
});

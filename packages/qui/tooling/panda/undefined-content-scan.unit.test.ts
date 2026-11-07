import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { createConfig } from "../config";
import {
  undefinedContentTagsFromSource,
  writeUndefinedContentTags,
} from "./undefined-content-scan";

async function fixture(source: string): Promise<{
  config: ReturnType<typeof createConfig>;
  cleanup: () => Promise<void>;
}> {
  const root = await mkdtemp(join(tmpdir(), "qui-undefined-content-"));
  const config = createConfig(root);
  await mkdir(config.source.components, { recursive: true });
  await writeFile(join(config.source.components, "demo.tsx"), source);
  return {
    config,
    cleanup: async () => {
      await rm(root, { recursive: true, force: true });
    },
  };
}

describe("undefined content tags", () => {
  it("writes a stable module and supports an empty tag list", async () => {
    const { config, cleanup } = await fixture(`
      /** @undefinedContent */
      @Component({ tag: "qui-demo" })
      export class Demo {}
    `);

    try {
      await expect(undefinedContentTagsFromSource(config)).resolves.toEqual(["qui-demo"]);

      await writeUndefinedContentTags(config);
      const generated = await readFile(config.file.undefinedContentTags, "utf8");
      expect(generated).toContain('"qui-demo"');

      await writeUndefinedContentTags(config);
      await expect(readFile(config.file.undefinedContentTags, "utf8")).resolves.toBe(generated);

      await writeUndefinedContentTags(config, []);
      await expect(readFile(config.file.undefinedContentTags, "utf8")).resolves.toContain(
        "= [] as const;",
      );
    } finally {
      await cleanup();
    }
  });

  it("surfaces parse errors instead of dropping markers", async () => {
    const { config, cleanup } = await fixture(`
      /** @undefinedContent */
      @Component({ tag: "qui-broken" })
      export class Broken {
    `);

    try {
      await expect(undefinedContentTagsFromSource(config)).rejects.toThrow("[qui] failed to parse");
    } finally {
      await cleanup();
    }
  });
});

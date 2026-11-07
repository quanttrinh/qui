import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { normalizeHydratePackageJson } from "./hydrate-package";

describe("normalizeHydratePackageJson", () => {
  it("removes only the nested exports field", async () => {
    const directory = await mkdtemp(join(tmpdir(), "qui-hydrate-package-"));
    const file = join(directory, "package.json");

    try {
      await writeFile(
        file,
        `${JSON.stringify({
          name: "@quanttrinh/qui/hydrate",
          main: "index.js",
          types: "index.d.ts",
          exports: { ".": "./index.js" },
        })}\n`,
      );

      await expect(normalizeHydratePackageJson(file)).resolves.toBe(true);
      await expect(readFile(file, "utf8")).resolves.toBe(
        `${JSON.stringify(
          {
            name: "@quanttrinh/qui/hydrate",
            main: "index.js",
            types: "index.d.ts",
          },
          null,
          2,
        )}\n`,
      );
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it("ignores a missing file", async () => {
    await expect(
      normalizeHydratePackageJson(join(tmpdir(), "qui-missing-hydrate-package.json")),
    ).resolves.toBe(false);
  });

  it("fails loudly on malformed package metadata", async () => {
    const directory = await mkdtemp(join(tmpdir(), "qui-hydrate-package-"));
    const file = join(directory, "package.json");

    try {
      await writeFile(file, "{");
      await expect(normalizeHydratePackageJson(file)).rejects.toThrow();
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
});

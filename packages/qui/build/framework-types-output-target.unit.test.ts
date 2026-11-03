import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { frameworkTypesOutputTarget } from "./framework-types-output-target";

const roots: string[] = [];

afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

const components = [
  {
    tagName: "qui-button",
    properties: [
      {
        name: "variant",
        complexType: { original: "ButtonVariant", references: {} },
        docs: { text: "The visual style." },
      },
    ],
    events: [
      {
        name: "press",
        complexType: { original: "void", references: {} },
        docs: { text: "Emitted on press." },
      },
    ],
  },
];

async function generate(packageName: string): Promise<{
  root: string;
  writes: Map<string, string>;
}> {
  const root = await mkdtemp(join(tmpdir(), "qui-framework-types-"));
  roots.push(root);

  const packageJsonPath = join(root, "package.json");
  await writeFile(packageJsonPath, JSON.stringify({ name: packageName }));

  const writes = new Map<string, string>();
  const target = frameworkTypesOutputTarget({ rootDir: root });
  const generateTypes = target.generator as unknown as (
    config: unknown,
    compilerCtx: unknown,
    buildCtx: unknown,
  ) => Promise<void>;

  await generateTypes(
    { packageJsonFilePath: packageJsonPath },
    {
      fs: {
        async writeFile(file: string, content: string): Promise<void> {
          writes.set(file, content);
        },
      },
    },
    { components },
  );

  return { root, writes };
}

describe("frameworkTypesOutputTarget", () => {
  it("reads the package name from package.json", async () => {
    const { root, writes } = await generate("@acme/qui");
    const react = writes.get(join(root, "dist", "types", "react.d.ts")) ?? "";

    expect(react).toContain("from '@acme/qui';");
    expect(react).toContain("import '@acme/qui/types/react';");
    expect(react).toContain("ButtonVariant");
    expect(react).toContain("QuiButtonCustomEvent");
  });

  it("writes declarations and runtime stubs for every framework", async () => {
    const { root, writes } = await generate("@acme/qui");

    for (const framework of ["react", "solid", "preact"]) {
      expect(writes.get(join(root, "dist", "types", `${framework}.d.ts`))).toBeTruthy();
      expect(writes.get(join(root, "dist", "types", `${framework}.js`))).toContain("export {}");
    }
  });

  it("fails when the package manifest has no name", async () => {
    await expect(generate("")).rejects.toThrow("missing a package name");
  });
});

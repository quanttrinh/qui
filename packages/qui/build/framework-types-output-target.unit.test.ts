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
        complexType: {
          original: "ButtonVariant",
          references: { ButtonVariant: { location: "local" } },
        },
        docs: { text: "The visual style." },
      },
    ],
    events: [
      {
        name: "checkedchange",
        complexType: {
          original: "{ checked: CheckedState }",
          references: { CheckedState: { location: "local" } },
        },
        docs: { text: "Emitted when the checked state changes." },
      },
    ],
  },
];

interface GenerateOptions {
  readonly components?: unknown;
  readonly manifest?: string;
  readonly packageJsonPath?: null;
}

async function generate(options: GenerateOptions = {}): Promise<{
  root: string;
  writes: Map<string, string>;
}> {
  const root = await mkdtemp(join(tmpdir(), "qui-framework-types-"));
  roots.push(root);

  const packageJsonPath = options.packageJsonPath === null ? undefined : join(root, "package.json");
  if (packageJsonPath !== undefined) {
    await writeFile(packageJsonPath, options.manifest ?? JSON.stringify({ name: "@acme/qui" }));
  }

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
    { components: options.components ?? components },
  );

  return { root, writes };
}

describe("frameworkTypesOutputTarget", () => {
  it("reads the package name and imports referenced types from it", async () => {
    const { root, writes } = await generate();
    const react = writes.get(join(root, "dist", "types", "react.d.ts")) ?? "";
    const importLine = react.split("\n").find((line) => line.includes("from '@acme/qui';")) ?? "";

    expect(react).toContain("import '@acme/qui/types/react';");
    expect(react).toContain('"./types/react": { "types": "./dist/types/react.d.ts" }');
    expect(importLine).toContain("ButtonVariant");
    expect(importLine).toContain("CheckedState");
    expect(importLine).toContain("QuiButtonCustomEvent");
  });

  it("writes declarations and runtime stubs for every framework", async () => {
    const { root, writes } = await generate();

    for (const framework of ["react", "solid", "preact"]) {
      expect(writes.get(join(root, "dist", "types", `${framework}.d.ts`))).toBeTruthy();
      expect(writes.get(join(root, "dist", "types", `${framework}.js`))).toContain("export {}");
    }
  });

  it("uses Preact custom element event names exactly", async () => {
    const { root, writes } = await generate();
    const preact = writes.get(join(root, "dist", "types", "preact.d.ts")) ?? "";

    expect(preact).toContain("'oncheckedchange'");
    expect(preact).not.toContain("'onCheckedchange'");
  });

  it("fails when packageJsonFilePath is missing", async () => {
    await expect(generate({ packageJsonPath: null })).rejects.toThrow(
      "did not provide a package.json path",
    );
  });

  it("fails when the package manifest has no name", async () => {
    await expect(generate({ manifest: "{}" })).rejects.toThrow("missing a valid package name");
  });

  it("fails when the package name is not a string", async () => {
    await expect(generate({ manifest: '{"name":42}' })).rejects.toThrow(
      "missing a valid package name",
    );
  });

  it("fails when the package manifest is malformed", async () => {
    await expect(generate({ manifest: "{" })).rejects.toThrow();
  });

  it("fails when no components produce declarations", async () => {
    await expect(generate({ components: [] })).rejects.toThrow(/no .* declarations were generated/);
  });
});

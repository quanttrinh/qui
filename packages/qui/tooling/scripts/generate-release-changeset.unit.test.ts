import { describe, expect, it } from "vitest";

import {
  classifyRangeChange,
  collectReleaseChanges,
  collectManifestRelease,
  renderChangeset,
} from "./generate-release-changeset";

describe("classifyRangeChange", () => {
  it("classifies semver changes", () => {
    expect(classifyRangeChange("^1.2.3", "^1.2.4")).toBe("patch");
    expect(classifyRangeChange("^1.2.3", "^1.3.0")).toBe("minor");
    expect(classifyRangeChange("^1.2.3", "^2.0.0")).toBe("major");
  });

  it("classifies zero-major versions", () => {
    expect(classifyRangeChange("^0.1.2", "^0.1.3")).toBe("patch");
    expect(classifyRangeChange("^0.1.2", "^0.2.0")).toBe("minor");
  });

  it("falls back to patch for non-version ranges", () => {
    expect(classifyRangeChange("workspace:^", "workspace:*")).toBe("patch");
    expect(classifyRangeChange(undefined, "^1.0.0")).toBe("patch");
  });
});

describe("collectManifestRelease", () => {
  it("collects publishable dependency changes", () => {
    const change = collectManifestRelease({
      path: "packages/qui/package.json",
      base: {
        name: "@quanttrinh/qui",
        dependencies: { alpha: "^1.2.3", beta: "^0.1.0" },
        devDependencies: { tooling: "^1.0.0" },
      },
      head: {
        name: "@quanttrinh/qui",
        dependencies: { alpha: "^1.3.0", gamma: "^2.0.0" },
        devDependencies: { tooling: "^2.0.0" },
      },
    });

    expect(change?.bump).toBe("minor");
    expect(change?.summary).toEqual([
      "- `packages/qui/package.json`: `alpha`: `^1.2.3` -> `^1.3.0`",
      "- `packages/qui/package.json`: added `gamma` at `^2.0.0`",
      "- `packages/qui/package.json`: removed `beta` (was `^0.1.0`)",
    ]);
  });

  it("ignores private packages and dev-only changes", () => {
    expect(
      collectManifestRelease({
        path: "package.json",
        base: { name: "root", private: true, dependencies: { alpha: "^1.0.0" } },
        head: { name: "root", private: true, dependencies: { alpha: "^2.0.0" } },
      }),
    ).toBeUndefined();

    expect(
      collectManifestRelease({
        path: "packages/qui/package.json",
        base: { name: "@quanttrinh/qui", devDependencies: { tooling: "^1.0.0" } },
        head: { name: "@quanttrinh/qui", devDependencies: { tooling: "^2.0.0" } },
      }),
    ).toBeUndefined();
  });
});

describe("collectReleaseChanges", () => {
  it("aggregates changes by package name", () => {
    const changes = collectReleaseChanges([
      {
        path: "packages/qui/package.json",
        base: { name: "@quanttrinh/qui", dependencies: { alpha: "^1.0.0" } },
        head: { name: "@quanttrinh/qui", dependencies: { alpha: "^1.1.0" } },
      },
      {
        path: "packages/qui/tools/package.json",
        base: { name: "@quanttrinh/qui", peerDependencies: { beta: "^1.0.0" } },
        head: { name: "@quanttrinh/qui", peerDependencies: { beta: "^2.0.0" } },
      },
    ]);

    expect(changes).toHaveLength(1);
    expect(changes[0]?.bump).toBe("major");
    expect(changes[0]?.summary).toHaveLength(2);
  });
});

describe("renderChangeset", () => {
  it("renders frontmatter and dependency summary", () => {
    const changes = collectReleaseChanges([
      {
        path: "packages/qui/package.json",
        base: { name: "@quanttrinh/qui", dependencies: { alpha: "^1.0.0" } },
        head: { name: "@quanttrinh/qui", dependencies: { alpha: "^1.0.1" } },
      },
    ]);

    expect(renderChangeset(changes)).toBe(`---
"@quanttrinh/qui": patch
---

Dependency updates:

- \`packages/qui/package.json\`: \`alpha\`: \`^1.0.0\` -> \`^1.0.1\`
`);
  });
});

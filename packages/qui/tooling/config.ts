/// <reference types="node" />
import { join } from "node:path";

/** Absolute paths and fixed inputs used by the package build. */
export interface Config {
  root: string;
  frameworks: readonly ["react", "solid", "preact"];
  source: {
    src: string;
    components: string;
    utilities: string;
    theme: string;
    /** Panda include glob, relative to the package root. */
    include: string;
  };
  output: {
    dist: string;
    shared: string;
    hydrate: string;
    types: string;
    utilities: string;
    styledSystem: string;
    /** Styled-system directory name, relative to the package root. */
    styledSystemName: string;
    components: string;
    styleUrls: string;
    test: string;
    /** Types import prefix used by framework declaration output. */
    typesImport: string;
  };
  file: {
    packageJson: string;
    lockfile: string;
    pandaConfig: string;
    tsconfig: string;
    themeEntry: string;
    themeCss: string;
    sharedCss: string;
    styleManifest: string;
    styleStrategy: string;
    styleUrlsModule: string;
    styleUrlsDeclaration: string;
    typesEntry: string;
    componentTypes: string;
    /** Generated undefined-content tag module imported by the Panda config. */
    undefinedContentTags: string;
    /** Generated Stencil declaration file name to exclude from style hashing. */
    generatedComponents: string;
  };
  /** Files that invalidate the generated stylesheet. */
  configInputs: string[];
  /** Build modules that invalidate the style generator when edited. */
  styleBuildInputs: string[];
  binary: {
    pandaPackage: string;
    pandaWorkspace: string;
  };
}

export function createConfig(root: string): Config {
  const executable = process.platform === "win32" ? "panda.cmd" : "panda";
  const styledSystem = join(root, "styled-system");
  const types = join(root, "dist", "types");

  return {
    root,
    frameworks: ["react", "solid", "preact"],
    source: {
      src: join(root, "src"),
      components: join(root, "src", "components"),
      utilities: join(root, "src", "utilities"),
      theme: join(root, "src", "utilities", "theme"),
      include: "./src/**/*.{ts,tsx}",
    },
    output: {
      dist: join(root, "dist"),
      shared: join(root, "dist", "shared"),
      hydrate: join(root, "dist", "hydrate"),
      types,
      utilities: join(root, "dist", "utilities"),
      styledSystem,
      styledSystemName: "styled-system",
      components: join(styledSystem, "components"),
      styleUrls: join(styledSystem, "style-urls"),
      test: join(root, ".stencil-test"),
      typesImport: "types",
    },
    file: {
      packageJson: join(root, "package.json"),
      lockfile: join(root, "..", "..", "bun.lock"),
      pandaConfig: join(root, "panda.config.ts"),
      tsconfig: join(root, "tsconfig.build.json"),
      themeEntry: join(root, "src", "utilities", "theme", "index.ts"),
      themeCss: join(styledSystem, "theme.css"),
      sharedCss: join(styledSystem, "styles.css"),
      styleManifest: join(styledSystem, "style-manifest.json"),
      styleStrategy: join(styledSystem, "style-strategy.json"),
      styleUrlsModule: join(styledSystem, "style-urls", "index.js"),
      styleUrlsDeclaration: join(styledSystem, "style-urls", "index.d.ts"),
      typesEntry: join(types, "index.d.ts"),
      componentTypes: join(types, "components.d.ts"),
      undefinedContentTags: join(
        root,
        "tooling",
        "panda",
        "generated",
        "undefined-content-tags.ts",
      ),
      generatedComponents: "components.d.ts",
    },
    configInputs: [join(root, "panda.config.ts")],
    styleBuildInputs: [
      join(root, "tooling", "config.ts"),
      join(root, "tooling", "panda", "component-tags.ts"),
      join(root, "tooling", "panda", "css.ts"),
      join(root, "tooling", "panda", "layer-order.ts"),
      join(root, "tooling", "panda", "panda-driver.ts"),
      join(root, "tooling", "panda", "theme-css.ts"),
      join(root, "tooling", "panda", "undefined-content.ts"),
      join(root, "tooling", "panda", "undefined-content-scan.ts"),
      join(root, "tooling", "plugins", "rollup", "pandacss.ts"),
      join(root, "tooling", "plugins", "stencil", "styles.ts"),
    ],
    binary: {
      pandaPackage: join(root, "node_modules", ".bin", executable),
      pandaWorkspace: join(root, "..", "..", "node_modules", ".bin", executable),
    },
  };
}

import type { Logger } from "@stencil/core/internal";

/// <reference types="node" />
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";

import { type PandaDriver } from "./build/panda-driver";
import { generateThemeCss } from "./build/theme-css";

interface ComponentEntry {
  file: string;
  tag: string;
  name: string;
  output: string;
}

interface StylesPluginOptions {
  root: string;
  driver: PandaDriver;
  logger: Logger;
}

interface StylePluginContext {
  addWatchFile(path: string): void;
}

interface PluginState {
  generator: StyleGenerator;
  hashes: Map<string, string>;
  key: string;
}

const STYLED_SYSTEM = "styled-system";
const COMPONENTS = "components";
const SHARED_PLACEHOLDER = "/* Styles are provided by the shared stylesheet. */\n";
const CONFIG_INPUTS = ["panda.config.ts"];
const STYLE_BUILD_INPUTS = [
  "build/css.ts",
  "build/panda-driver.ts",
  "build/theme-css.ts",
  "styles.stencil.plugin.ts",
];
const KEBAB_SEGMENT = /-([a-z])/gu;
const COMPONENT_TAG = /tag:\s*"([^"]+)"/u;

let pluginState: PluginState | undefined;

function walk(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

function toPosix(path: string): string {
  return path.split("\\").join("/");
}

function relativePath(root: string, file: string): string {
  return toPosix(relative(root, file));
}

function styleUrlKey(name: string): string {
  return name.replaceAll(KEBAB_SEGMENT, (_match, character: string) => character.toUpperCase());
}

function writeIfChanged(file: string, contents: string | Buffer): void {
  const data = typeof contents === "string" ? Buffer.from(contents) : contents;
  if (existsSync(file) && readFileSync(file).equals(data)) {
    return;
  }
  writeFileSync(file, data);
}

function fileHashes(root: string): Map<string, string> {
  const files = [
    ...CONFIG_INPUTS.map((input) => join(root, input)),
    ...STYLE_BUILD_INPUTS.map((input) => join(root, input)),
    ...walk(join(root, "src")).filter(
      (file) =>
        (file.endsWith(".ts") || file.endsWith(".tsx")) && !file.endsWith("components.d.ts"),
    ),
  ];
  return new Map(
    files.sort().map((file) => [file, createHash("sha1").update(readFileSync(file)).digest("hex")]),
  );
}

function hashesDigest(hashes: Map<string, string>): string {
  const digest = createHash("sha1");
  for (const [file, hash] of [...hashes].sort(([left], [right]) => left.localeCompare(right))) {
    digest.update(file).update(hash);
  }
  return digest.digest("hex");
}

/** Theme source plus its generator, used to avoid reloading it on every rebuild. */
function themeSourceHash(root: string): string {
  const files = [
    join(root, "build", "theme-css.ts"),
    ...walk(join(root, "src", "utilities", "theme")).filter((file) => file.endsWith(".ts")),
  ];
  return hashesDigest(
    new Map(
      files
        .sort()
        .map((file) => [file, createHash("sha1").update(readFileSync(file)).digest("hex")]),
    ),
  );
}

function manifestHash(root: string): string | undefined {
  try {
    const value: unknown = JSON.parse(
      readFileSync(join(root, STYLED_SYSTEM, "style-manifest.json"), "utf8"),
    );
    if (typeof value === "object" && value !== null && "hash" in value) {
      const hash = Reflect.get(value, "hash");
      return typeof hash === "string" ? hash : undefined;
    }
  } catch {
    // Missing or malformed manifests require a full regeneration.
  }
  return undefined;
}

function changedFiles(previous: Map<string, string>, next: Map<string, string>): string[] {
  const changed: string[] = [];
  for (const [file, hash] of next) {
    if (previous.get(file) !== hash) {
      changed.push(file);
    }
  }
  for (const file of previous.keys()) {
    if (!next.has(file)) {
      changed.push(file);
    }
  }
  return changed;
}

function panda(root: string, args: string[], logger: Logger): void {
  const binary = join(
    root,
    "node_modules",
    ".bin",
    process.platform === "win32" ? "panda.cmd" : "panda",
  );
  try {
    execFileSync(binary, args, { cwd: root, stdio: "pipe" });
  } catch (error) {
    const stderr = (error as { stderr?: Buffer }).stderr?.toString().trim();
    if (stderr) {
      logger.error(stderr);
    }
    throw error;
  }
}

function findComponents(root: string): ComponentEntry[] {
  const outputDirectory = join(root, STYLED_SYSTEM, COMPONENTS);
  mkdirSync(outputDirectory, { recursive: true });

  return walk(join(root, "src", COMPONENTS))
    .filter((file) => file.endsWith(".tsx"))
    .flatMap((file) => {
      const source = readFileSync(file, "utf8");
      if (!source.includes("@Component(")) {
        return [];
      }
      const tag = source.match(COMPONENT_TAG)?.[1];
      if (tag === undefined) {
        return [];
      }
      const name = file.slice(file.lastIndexOf("/") + 1, -".tsx".length);
      return [
        {
          file,
          tag,
          name,
          output: join(outputDirectory, `${name}.css`),
        },
      ];
    })
    .sort((a, b) => a.tag.localeCompare(b.tag));
}

function sameComponents(a: ComponentEntry[], b: ComponentEntry[]): boolean {
  return (
    a.length === b.length &&
    a.every(
      (component, index) =>
        component.file === b[index]?.file &&
        component.tag === b[index]?.tag &&
        component.output === b[index]?.output,
    )
  );
}

function writeStyleUrlModule(outdir: string, components: ComponentEntry[]): void {
  const entries = components.map((component) => ({
    key: styleUrlKey(component.name),
    value: relativePath(dirname(component.file), component.output),
  }));
  const moduleDirectory = join(outdir, "style-urls");
  mkdirSync(moduleDirectory, { recursive: true });

  writeIfChanged(
    join(moduleDirectory, "index.js"),
    `export const styleUrls = {\n${entries
      .map(({ key, value }) => `  ${key}: ${JSON.stringify(value)},`)
      .join("\n")}\n};\n`,
  );
  writeIfChanged(
    join(moduleDirectory, "index.d.ts"),
    `export declare const styleUrls: {\n${entries
      .map(({ key, value }) => `  readonly ${key}: ${JSON.stringify(value)};`)
      .join("\n")}\n};\n`,
  );
}

class StyleGenerator {
  private readonly outdir: string;
  private readonly pandaRoot: string;
  private readonly driver: PandaDriver;
  private readonly logger: Logger;
  private components: ComponentEntry[];
  private cssPending = false;
  private cssPromise?: Promise<void>;
  private themeCache?: { key: string; css: string };

  constructor(root: string, driver: PandaDriver, logger: Logger) {
    this.pandaRoot = root;
    this.outdir = join(root, STYLED_SYSTEM);
    this.driver = driver;
    this.logger = logger;
    this.components = findComponents(root);
    mkdirSync(this.outdir, { recursive: true });
  }

  get key(): string {
    return this.pandaRoot;
  }

  /**
   * Synchronous bootstrap required before Stencil scans component decorators.
   * Codegen and style-url placeholders must exist before this hook returns.
   */
  generateBootstrap(reason: string): void {
    this.logger.info(`[qui] bootstrapping Panda styles (${reason})`);
    this.components = findComponents(this.pandaRoot);

    this.logger.info("[qui] generating Panda styled-system");
    panda(this.pandaRoot, ["codegen"], this.logger);
    writeStyleUrlModule(this.outdir, this.components);
    this.writePlaceholders();
    this.pruneComponentStyles();
    this.cssPending = true;
  }

  update(changed: string[]): boolean | undefined {
    if (changed.length === 0) {
      return undefined;
    }
    if (changed.some((file) => this.isConfigFile(file) || this.isThemeFile(file))) {
      this.generateBootstrap("config or theme changed");
      return true;
    }

    const nextComponents = findComponents(this.pandaRoot);
    if (!sameComponents(this.components, nextComponents)) {
      this.components = nextComponents;
      writeStyleUrlModule(this.outdir, this.components);
      this.writePlaceholders();
      this.pruneComponentStyles();
      this.cssPending = true;
      return false;
    }

    return false;
  }

  hasPendingCss(): boolean {
    return this.cssPending;
  }

  async generateCss(reload: boolean): Promise<void> {
    this.cssPromise ??= this.generateCssNow(reload).finally(() => {
      this.cssPromise = undefined;
    });
    await this.cssPromise;
  }

  private async generateCssNow(reload: boolean): Promise<void> {
    this.logger.info("[qui] generating shared styles");
    if (reload) {
      await this.driver.reload();
    }
    const themeKey = themeSourceHash(this.pandaRoot);
    if (this.themeCache?.key !== themeKey) {
      this.themeCache = { key: themeKey, css: await generateThemeCss() };
    }
    const themeCss = this.themeCache.css;
    const sharedCss = await this.driver.generateStyles();
    writeIfChanged(join(this.outdir, "theme.css"), themeCss);
    writeIfChanged(join(this.outdir, "styles.css"), sharedCss);
    this.cssPending = false;
    this.writeManifest();
    this.logger.info("[qui] styles generated");
  }

  private writePlaceholders(): void {
    for (const component of this.components) {
      writeIfChanged(component.output, SHARED_PLACEHOLDER);
    }
  }

  private pruneComponentStyles(): void {
    const expected = new Set(this.components.map((component) => component.output));
    for (const file of readdirSync(join(this.outdir, COMPONENTS))) {
      if (!file.endsWith(".css")) {
        continue;
      }
      const path = join(this.outdir, COMPONENTS, file);
      if (!expected.has(path)) {
        rmSync(path, { force: true });
      }
    }
  }

  private isConfigFile(file: string): boolean {
    return CONFIG_INPUTS.some((input) => resolve(this.pandaRoot, input) === file);
  }

  private isThemeFile(file: string): boolean {
    return toPosix(file).startsWith(
      `${toPosix(join(this.pandaRoot, "src", "utilities", "theme"))}/`,
    );
  }

  private writeManifest(): void {
    rmSync(join(this.outdir, "style-strategy.json"), { force: true });
    writeIfChanged(
      join(this.outdir, "style-manifest.json"),
      `${JSON.stringify(
        {
          hash: hashesDigest(fileHashes(this.pandaRoot)),
          components: this.components.map((component) => ({
            tag: component.tag,
            file: relativePath(this.pandaRoot, component.file),
            css: relativePath(this.pandaRoot, component.output),
          })),
        },
        null,
        2,
      )}\n`,
    );
  }
}

/**
 * Bootstraps Panda codegen synchronously for Stencil decorator scanning, then
 * regenerates the shared CSS through the shared driver on watch rebuilds.
 */
export function stylesPlugin({ root, driver, logger }: StylesPluginOptions) {
  const key = root;
  const hashes = fileHashes(root);
  const previous = pluginState;
  const reusableState =
    previous !== undefined &&
    previous.key === key &&
    changedFiles(previous.hashes, hashes).length === 0 &&
    existsSync(join(root, STYLED_SYSTEM, "style-manifest.json"))
      ? previous
      : undefined;
  const generator = reusableState?.generator ?? new StyleGenerator(root, driver, logger);
  const generatedFilesExist = [
    join(root, STYLED_SYSTEM, "theme.css"),
    join(root, STYLED_SYSTEM, "styles.css"),
    join(root, STYLED_SYSTEM, "style-urls", "index.js"),
  ].every((file) => existsSync(file));
  const canReuseMemoryState = reusableState !== undefined && generatedFilesExist;
  const canReuseDiskState =
    reusableState === undefined &&
    generatedFilesExist &&
    manifestHash(root) === hashesDigest(hashes);

  if (!canReuseMemoryState && !canReuseDiskState) {
    generator.generateBootstrap("initial build");
  }
  pluginState = { generator, hashes, key };

  return {
    name: "qui-styles",
    async buildStart(this: StylePluginContext): Promise<void> {
      for (const input of [...CONFIG_INPUTS, ...STYLE_BUILD_INPUTS]) {
        this.addWatchFile(join(root, input));
      }

      if (generator.hasPendingCss()) {
        await generator.generateCss(false);
      }

      const next = fileHashes(root);
      const current = pluginState;
      if (current !== undefined) {
        const changed = changedFiles(current.hashes, next);
        if (changed.length > 0) {
          const reload = current.generator.update(changed);
          if (reload !== undefined) {
            await current.generator.generateCss(reload);
          }
        }
      }
      pluginState = { generator, hashes: next, key };
    },
  };
}

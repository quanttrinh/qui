import type { Logger } from "@stencil/core/internal";

/// <reference types="node" />
import { execFile, execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { access, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { promisify } from "node:util";

import { type BuildConfig } from "../../config";
import { type PandaDriver } from "../../panda/panda-driver";
import { generateThemeCss } from "../../panda/theme-css";

interface ComponentEntry {
  file: string;
  tag: string;
  name: string;
  output: string;
}

interface StylesPluginOptions {
  config: BuildConfig;
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

const SHARED_PLACEHOLDER = "/* Styles are provided by the shared stylesheet. */\n";
const KEBAB_SEGMENT = /-([a-z])/gu;
const COMPONENT_TAG = /tag:\s*"([^"]+)"/u;

let pluginState: PluginState | undefined;

const execFileAsync = promisify(execFile);

function walkSync(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? walkSync(path) : [path];
  });
}

async function walk(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(path)));
    } else {
      files.push(path);
    }
  }
  return files;
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

function writeIfChangedSync(file: string, contents: string | Buffer): void {
  const data = typeof contents === "string" ? Buffer.from(contents) : contents;
  if (existsSync(file) && readFileSync(file).equals(data)) {
    return;
  }
  writeFileSync(file, data);
}

async function writeIfChanged(file: string, contents: string): Promise<void> {
  try {
    if ((await readFile(file, "utf8")) === contents) {
      return;
    }
  } catch {
    // The file does not exist yet.
  }
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, contents);
}

function fileHashesSync(config: BuildConfig): Map<string, string> {
  const files = [
    ...config.configInputs,
    ...config.styleBuildInputs,
    ...walkSync(config.source.src).filter(
      (file) =>
        (file.endsWith(".ts") || file.endsWith(".tsx")) &&
        !file.endsWith(config.file.generatedComponents),
    ),
  ];
  return new Map(
    files.sort().map((file) => [file, createHash("sha1").update(readFileSync(file)).digest("hex")]),
  );
}

async function fileHashes(config: BuildConfig): Promise<Map<string, string>> {
  const files = [
    ...config.configInputs,
    ...config.styleBuildInputs,
    ...(await walk(config.source.src)).filter(
      (file) =>
        (file.endsWith(".ts") || file.endsWith(".tsx")) &&
        !file.endsWith(config.file.generatedComponents),
    ),
  ];
  const entries = await Promise.all(
    files.sort().map(
      async (file) =>
        [
          file,
          createHash("sha1")
            .update(await readFile(file))
            .digest("hex"),
        ] as const,
    ),
  );
  return new Map(entries);
}

function hashesDigest(hashes: Map<string, string>): string {
  const digest = createHash("sha1");
  for (const [file, hash] of [...hashes].sort(([left], [right]) => left.localeCompare(right))) {
    digest.update(file).update(hash);
  }
  return digest.digest("hex");
}

/** Theme source files, used to avoid reloading Material on every rebuild. */
async function themeSourceHash(config: BuildConfig): Promise<string> {
  const files = (await walk(config.source.theme)).filter((file) => file.endsWith(".ts"));
  const entries = await Promise.all(
    files.sort().map(
      async (file) =>
        [
          file,
          createHash("sha1")
            .update(await readFile(file))
            .digest("hex"),
        ] as const,
    ),
  );
  return hashesDigest(new Map(entries));
}

function manifestHash(config: BuildConfig): string | undefined {
  try {
    const value: unknown = JSON.parse(readFileSync(config.file.styleManifest, "utf8"));
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

async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

function pandaBinary(config: BuildConfig): string {
  return existsSync(config.binary.pandaPackage)
    ? config.binary.pandaPackage
    : config.binary.pandaWorkspace;
}

function panda(config: BuildConfig, args: string[], logger: Logger): void {
  const binary = pandaBinary(config);
  try {
    execFileSync(binary, args, { cwd: config.root, stdio: "pipe" });
  } catch (error) {
    const stderr = (error as { stderr?: Buffer }).stderr?.toString().trim();
    if (stderr) {
      logger.error(stderr);
    }
    throw error;
  }
}

async function pandaAsync(config: BuildConfig, args: string[], logger: Logger): Promise<void> {
  const binary = (await pathExists(config.binary.pandaPackage))
    ? config.binary.pandaPackage
    : config.binary.pandaWorkspace;
  try {
    await execFileAsync(binary, args, { cwd: config.root });
  } catch (error) {
    const stderr = (error as { stderr?: string }).stderr?.trim();
    if (stderr) {
      logger.error(stderr);
    }
    throw error;
  }
}

function componentEntry(
  file: string,
  source: string,
  outputDirectory: string,
): ComponentEntry | undefined {
  if (!source.includes("@Component(")) {
    return undefined;
  }
  const tag = source.match(COMPONENT_TAG)?.[1];
  if (tag === undefined) {
    return undefined;
  }
  const name = file.slice(file.lastIndexOf("/") + 1, -".tsx".length);
  return {
    file,
    tag,
    name,
    output: join(outputDirectory, `${name}.css`),
  };
}

function findComponentsSync(config: BuildConfig): ComponentEntry[] {
  const outputDirectory = config.output.components;
  mkdirSync(outputDirectory, { recursive: true });

  return walkSync(config.source.components)
    .filter((file) => file.endsWith(".tsx"))
    .flatMap((file) => {
      const entry = componentEntry(file, readFileSync(file, "utf8"), outputDirectory);
      return entry === undefined ? [] : [entry];
    })
    .sort((a, b) => a.tag.localeCompare(b.tag));
}

async function findComponents(config: BuildConfig): Promise<ComponentEntry[]> {
  const outputDirectory = config.output.components;
  await mkdir(outputDirectory, { recursive: true });

  const files = (await walk(config.source.components)).filter((file) => file.endsWith(".tsx"));
  const entries = await Promise.all(
    files.map(async (file) => componentEntry(file, await readFile(file, "utf8"), outputDirectory)),
  );
  return entries
    .filter((entry): entry is ComponentEntry => entry !== undefined)
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

function styleUrlModuleContents(components: ComponentEntry[]): {
  declaration: string;
  module: string;
} {
  const entries = components.map((component) => ({
    key: styleUrlKey(component.name),
    value: relativePath(dirname(component.file), component.output),
  }));
  return {
    module: `export const styleUrls = {\n${entries
      .map(({ key, value }) => `  ${key}: ${JSON.stringify(value)},`)
      .join("\n")}\n};\n`,
    declaration: `export declare const styleUrls: {\n${entries
      .map(({ key, value }) => `  readonly ${key}: ${JSON.stringify(value)};`)
      .join("\n")}\n};\n`,
  };
}

function writeStyleUrlModuleSync(config: BuildConfig, components: ComponentEntry[]): void {
  const contents = styleUrlModuleContents(components);
  mkdirSync(config.output.styleUrls, { recursive: true });
  writeIfChangedSync(config.file.styleUrlsModule, contents.module);
  writeIfChangedSync(config.file.styleUrlsDeclaration, contents.declaration);
}

async function writeStyleUrlModule(
  config: BuildConfig,
  components: ComponentEntry[],
): Promise<void> {
  const contents = styleUrlModuleContents(components);
  await mkdir(config.output.styleUrls, { recursive: true });
  await Promise.all([
    writeIfChanged(config.file.styleUrlsModule, contents.module),
    writeIfChanged(config.file.styleUrlsDeclaration, contents.declaration),
  ]);
}

class StyleGenerator {
  private readonly config: BuildConfig;
  private readonly outdir: string;
  private readonly root: string;
  private readonly driver: PandaDriver;
  private readonly logger: Logger;
  private components: ComponentEntry[];
  private cssPending = false;
  private cssPromise?: Promise<void>;
  private themeCache?: { key: string; css: string };

  constructor(config: BuildConfig, driver: PandaDriver, logger: Logger) {
    this.config = config;
    this.root = config.root;
    this.outdir = config.output.styledSystem;
    this.driver = driver;
    this.logger = logger;
    this.components = findComponentsSync(config);
    mkdirSync(this.outdir, { recursive: true });
  }

  get key(): string {
    return this.root;
  }

  /**
   * Synchronous bootstrap required before Stencil scans component decorators.
   * Codegen and style-url placeholders must exist before this hook returns.
   */
  generateBootstrap(reason: string): void {
    this.logger.info(`[qui] bootstrapping Panda styles (${reason})`);
    this.components = findComponentsSync(this.config);

    this.logger.info("[qui] generating Panda styled-system");
    panda(this.config, ["codegen"], this.logger);
    writeStyleUrlModuleSync(this.config, this.components);
    this.writePlaceholdersSync();
    this.pruneComponentStylesSync();
    this.cssPending = true;
  }

  private async generateBootstrapAsync(reason: string): Promise<void> {
    this.logger.info(`[qui] bootstrapping Panda styles (${reason})`);
    this.components = await findComponents(this.config);

    this.logger.info("[qui] generating Panda styled-system");
    await pandaAsync(this.config, ["codegen"], this.logger);
    await writeStyleUrlModule(this.config, this.components);
    await this.writePlaceholders();
    await this.pruneComponentStyles();
    this.cssPending = true;
  }

  async update(changed: string[]): Promise<boolean | undefined> {
    if (changed.length === 0) {
      return undefined;
    }
    if (changed.some((file) => this.isConfigFile(file) || this.isThemeFile(file))) {
      await this.generateBootstrapAsync("config or theme changed");
      return true;
    }
    const nextComponents = await findComponents(this.config);
    if (!sameComponents(this.components, nextComponents)) {
      this.components = nextComponents;
      await writeStyleUrlModule(this.config, this.components);
      await this.writePlaceholders();
      await this.pruneComponentStyles();
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
    const themeKey = await themeSourceHash(this.config);
    if (this.themeCache?.key !== themeKey) {
      this.themeCache = { key: themeKey, css: await generateThemeCss(this.config) };
    }
    const themeCss = this.themeCache.css;
    const sharedCss = await this.driver.generateStyles();
    await writeIfChanged(this.config.file.themeCss, themeCss);
    await writeIfChanged(this.config.file.sharedCss, sharedCss);
    this.cssPending = false;
    await this.writeManifest();
    this.logger.info("[qui] styles generated");
  }

  private writePlaceholdersSync(): void {
    for (const component of this.components) {
      writeIfChangedSync(component.output, SHARED_PLACEHOLDER);
    }
  }

  private async writePlaceholders(): Promise<void> {
    await Promise.all(
      this.components.map((component) => writeIfChanged(component.output, SHARED_PLACEHOLDER)),
    );
  }

  private pruneComponentStylesSync(): void {
    const expected = new Set(this.components.map((component) => component.output));
    for (const file of readdirSync(this.config.output.components)) {
      if (!file.endsWith(".css")) {
        continue;
      }
      const path = join(this.config.output.components, file);
      if (!expected.has(path)) {
        rmSync(path, { force: true });
      }
    }
  }

  private async pruneComponentStyles(): Promise<void> {
    const expected = new Set(this.components.map((component) => component.output));
    const files = await readdir(this.config.output.components);
    await Promise.all(
      files
        .filter((file) => file.endsWith(".css"))
        .map(async (file) => {
          const path = join(this.config.output.components, file);
          if (!expected.has(path)) {
            await rm(path, { force: true });
          }
        }),
    );
  }

  private isConfigFile(file: string): boolean {
    return this.config.configInputs.includes(file);
  }

  private isThemeFile(file: string): boolean {
    return toPosix(file).startsWith(`${toPosix(this.config.source.theme)}/`);
  }

  private async writeManifest(): Promise<void> {
    await rm(this.config.file.styleStrategy, { force: true });
    await writeIfChanged(
      this.config.file.styleManifest,
      `${JSON.stringify(
        {
          hash: hashesDigest(await fileHashes(this.config)),
          components: this.components.map((component) => ({
            tag: component.tag,
            file: relativePath(this.root, component.file),
            css: relativePath(this.root, component.output),
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
export function stylesPlugin({ config, driver, logger }: StylesPluginOptions) {
  const key = config.root;
  const hashes = fileHashesSync(config);
  const previous = pluginState;
  const reusableState =
    previous !== undefined &&
    previous.key === key &&
    changedFiles(previous.hashes, hashes).length === 0 &&
    existsSync(config.file.styleManifest)
      ? previous
      : undefined;
  const generator = reusableState?.generator ?? new StyleGenerator(config, driver, logger);
  const generatedFilesExist = [
    config.file.themeCss,
    config.file.sharedCss,
    config.file.styleUrlsModule,
  ].every((file) => existsSync(file));
  const canReuseMemoryState = reusableState !== undefined && generatedFilesExist;
  const canReuseDiskState =
    reusableState === undefined &&
    generatedFilesExist &&
    manifestHash(config) === hashesDigest(hashes);

  if (!canReuseMemoryState && !canReuseDiskState) {
    generator.generateBootstrap("initial build");
  }
  pluginState = { generator, hashes, key };

  return {
    name: "qui-styles",
    async buildStart(this: StylePluginContext): Promise<void> {
      for (const input of config.configInputs) {
        this.addWatchFile(input);
      }

      if (generator.hasPendingCss()) {
        await generator.generateCss(false);
      }

      const next = await fileHashes(config);
      const current = pluginState;
      if (current !== undefined) {
        const changed = changedFiles(current.hashes, next);
        if (changed.length > 0) {
          const reload = await current.generator.update(changed);
          if (reload !== undefined) {
            await current.generator.generateCss(reload);
          }
        }
      }
      pluginState = { generator, hashes: next, key };
    },
  };
}

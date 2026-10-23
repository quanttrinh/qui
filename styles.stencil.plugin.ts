/// <reference types="node" />
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, relative, resolve } from "node:path";

type StyleStrategy = "shared" | "split";

interface ComponentEntry {
  file: string;
  tag: string;
  name: string;
  output: string;
}

interface StylesPluginOptions {
  root: string;
  strategy: StyleStrategy;
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
const LAYER_ORDER = "@layer reset, base, tokens, recipes, utilities;";
const SHARED_PLACEHOLDER = "/* Styles are provided by the shared stylesheet. */\n";
const CONFIG_INPUTS = ["panda.config.ts", "panda.theme.config.ts"];
const CSS_GEN_ARGS = ["cssgen", "--minify", "--log-level", "error"];

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
  return name.replaceAll(/-([a-z])/g, (_match, character: string) => character.toUpperCase());
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
    ...walk(join(root, "src")).filter(
      (file) =>
        (file.endsWith(".ts") || file.endsWith(".tsx")) && !file.endsWith("components.d.ts"),
    ),
  ];
  return new Map(
    files.sort().map((file) => [file, createHash("sha1").update(readFileSync(file)).digest("hex")]),
  );
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

function panda(root: string, args: string[]): void {
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
      console.error(stderr);
    }
    throw error;
  }
}

/** Remove complete CSS layer blocks, keeping the layer-order statement intact. */
function stripCssLayers(css: string, layers: readonly string[]): string {
  const removed = new Set(layers);
  const pattern = /@layer\s+([A-Za-z0-9_.-]+)\s*\{/g;
  const output: string[] = [];
  let copiedUntil = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(css)) !== null) {
    if (!removed.has(match[1])) {
      continue;
    }

    output.push(css.slice(copiedUntil, match.index));
    let depth = 0;
    let cursor = match.index + match[0].length - 1;
    while (cursor < css.length) {
      if (css[cursor] === "{") {
        depth += 1;
      } else if (css[cursor] === "}") {
        depth -= 1;
        if (depth === 0) {
          cursor += 1;
          break;
        }
      }
      cursor += 1;
    }
    copiedUntil = cursor;
    pattern.lastIndex = cursor;
  }

  output.push(css.slice(copiedUntil));
  return output.join("");
}

function localImports(file: string): string[] {
  const source = readFileSync(file, "utf8");
  const imports: string[] = [];
  for (const match of source.matchAll(/from\s+["'](\.[^"']+)["']/g)) {
    const base = resolve(dirname(file), match[1]);
    for (const candidate of [`${base}.ts`, `${base}.tsx`, join(base, "index.ts")]) {
      if (existsSync(candidate) && candidate !== file) {
        imports.push(candidate);
      }
    }
  }
  return imports;
}

function styleDependencies(file: string): string[] {
  return localImports(file).filter((candidate) => readFileSync(candidate, "utf8").includes("css("));
}

export function findComponents(root: string): ComponentEntry[] {
  const outputDirectory = join(root, STYLED_SYSTEM, COMPONENTS);
  mkdirSync(outputDirectory, { recursive: true });

  return walk(join(root, "src", COMPONENTS))
    .filter((file) => file.endsWith(".tsx"))
    .flatMap((file) => {
      const source = readFileSync(file, "utf8");
      if (!source.includes("@Component(")) {
        return [];
      }
      const tag = source.match(/tag:\s*"([^"]+)"/)?.[1];
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

export function writeStyleUrlModule(outdir: string, components: ComponentEntry[]): void {
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
  private readonly strategy: StyleStrategy;
  private components: ComponentEntry[];
  private temporaryFile = 0;

  constructor(root: string, strategy: StyleStrategy) {
    this.pandaRoot = root;
    this.strategy = strategy;
    this.outdir = join(root, STYLED_SYSTEM);
    this.components = findComponents(root);
    mkdirSync(this.outdir, { recursive: true });
  }

  get key(): string {
    return `${this.pandaRoot}:${this.strategy}`;
  }

  generateFull(reason: string): void {
    console.log(`[qui] generating ${this.strategy} styles (${reason})`);
    this.components = findComponents(this.pandaRoot);

    console.log("[qui] generating Panda styled-system");
    panda(this.pandaRoot, ["codegen"]);
    writeStyleUrlModule(this.outdir, this.components);
    this.generateTheme();

    if (this.strategy === "shared") {
      this.generateShared();
    } else {
      this.generateBase();
      for (const component of this.components) {
        this.generateComponent(component);
      }
    }

    this.pruneComponentStyles();
    this.syncSnapshot();
    this.writeManifest();
    console.log("[qui] styles generated");
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

  update(changed: string[]): void {
    if (changed.length === 0) {
      return;
    }
    if (changed.some((file) => this.isConfigFile(file) || this.isThemeFile(file))) {
      this.generateFull("config or theme changed");
      return;
    }

    const nextComponents = findComponents(this.pandaRoot);
    if (!sameComponents(this.components, nextComponents)) {
      this.components = nextComponents;
      this.generateFull("component set changed");
      return;
    }

    const affected = this.affectedComponents(changed);
    if (affected.length === 0) {
      return;
    }

    console.log(`[qui] updating ${this.strategy} styles (${affected.length} component(s))`);
    if (this.strategy === "shared") {
      this.generateShared();
    } else {
      this.generateBase();
      for (const component of affected) {
        this.generateComponent(component);
      }
    }
    this.syncSnapshot();
    console.log("[qui] styles updated");
  }

  private generateTheme(): void {
    this.generateCss(
      ["cssgen", "-c", "panda.theme.config.ts", "--minify", "--log-level", "error"],
      join(this.outdir, "theme.css"),
    );
  }

  private generateShared(): void {
    console.log("[qui] generating shared styles.css");
    this.generateCss(CSS_GEN_ARGS, join(this.outdir, "styles.css"));
    for (const component of this.components) {
      writeIfChanged(component.output, SHARED_PLACEHOLDER);
    }
  }

  private generateBase(): void {
    console.log("[qui] generating base.css (reset, used tokens, global styles)");
    this.generateCss(CSS_GEN_ARGS, join(this.outdir, "base.css"), {
      transform: (css) => stripCssLayers(css.toString("utf8"), ["utilities", "recipes"]),
    });
  }

  private generateComponent(component: ComponentEntry): void {
    const args = ["cssgen", "--minimal", "--minify", "--log-level", "error"];
    for (const include of [component.file, ...styleDependencies(component.file)]) {
      args.push("--include", relativePath(this.pandaRoot, include));
    }
    this.generateCss(args, component.output, { prefix: LAYER_ORDER });
    console.log(`[qui] ${component.tag}: ${statSync(component.output).size} B`);
  }

  private generateCss(
    args: string[],
    output: string,
    options: { prefix?: string; transform?: (css: Buffer) => string | Buffer } = {},
  ): void {
    const temporary = join(this.outdir, `.panda-${process.pid}-${this.temporaryFile++}.css`);
    try {
      panda(this.pandaRoot, [...args, "--outfile", relativePath(this.pandaRoot, temporary)]);
      const generated = readFileSync(temporary);
      const transformed = options.transform?.(generated) ?? generated;
      const css = Buffer.isBuffer(transformed) ? transformed : Buffer.from(transformed);
      writeIfChanged(
        output,
        options.prefix ? Buffer.concat([Buffer.from(options.prefix), css]) : css,
      );
    } finally {
      rmSync(temporary, { force: true });
    }
  }

  private affectedComponents(changed: string[]): ComponentEntry[] {
    const owned = new Map<string, ComponentEntry[]>();
    for (const component of this.components) {
      for (const file of [component.file, ...styleDependencies(component.file)]) {
        const entries = owned.get(file) ?? [];
        entries.push(component);
        owned.set(file, entries);
      }
    }

    const affected = new Set<ComponentEntry>();
    for (const file of changed) {
      for (const component of owned.get(file) ?? []) {
        affected.add(component);
      }
    }
    return [...affected].sort((a, b) => a.tag.localeCompare(b.tag));
  }

  private isConfigFile(file: string): boolean {
    return CONFIG_INPUTS.some((input) => resolve(this.pandaRoot, input) === file);
  }

  private isThemeFile(file: string): boolean {
    return toPosix(file).startsWith(
      `${toPosix(join(this.pandaRoot, "src", "utilities", "theme"))}/`,
    );
  }

  private syncSnapshot(): void {
    const snapshotDirectory = join(this.outdir, this.strategy, COMPONENTS);
    rmSync(snapshotDirectory, { recursive: true, force: true });
    cpSync(join(this.outdir, COMPONENTS), snapshotDirectory, { recursive: true });
  }

  private writeManifest(): void {
    writeIfChanged(
      join(this.outdir, "style-strategy.json"),
      `${JSON.stringify(
        {
          strategy: this.strategy,
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
 * Generates the Panda stylesheets before Stencil reads its project config, then
 * regenerates only the affected CSS on watch rebuilds.
 */
export function stylesPlugin({ root, strategy }: StylesPluginOptions) {
  const key = `${root}:${strategy}`;
  const hashes = fileHashes(root);
  const previous = pluginState;
  const reusableState =
    previous !== undefined &&
    previous.key === key &&
    changedFiles(previous.hashes, hashes).length === 0 &&
    existsSync(join(root, STYLED_SYSTEM, "style-strategy.json"))
      ? previous
      : undefined;
  const generator = reusableState?.generator ?? new StyleGenerator(root, strategy);

  if (reusableState === undefined) {
    generator.generateFull("initial build");
  }
  pluginState = { generator, hashes, key };

  return {
    name: "qui-styles",
    buildStart(this: StylePluginContext) {
      for (const input of CONFIG_INPUTS) {
        this.addWatchFile(join(root, input));
      }

      const next = fileHashes(root);
      const current = pluginState;
      if (current !== undefined) {
        const changed = changedFiles(current.hashes, next);
        if (changed.length > 0) {
          current.generator.update(changed);
        }
      }
      pluginState = { generator, hashes: next, key };
    },
  };
}

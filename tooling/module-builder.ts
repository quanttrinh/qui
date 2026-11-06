/// <reference types="node" />
import { access, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { ModuleKind, ScriptTarget, transpileDeclaration, transpileModule } from "typescript";

const SOURCE_EXTENSIONS = [".ts", ".tsx"] as const;
const RUNTIME_IMPORT = /\bfrom\s+(["'])(\.[^"']+)\1/g;
const TYPESCRIPT_EXTENSION = /\.tsx?$/u;
const RESOLVED_MODULE = /\.(?:[cm]?js|jsx|ts|tsx|json|css)$/u;
const JAVASCRIPT_EXTENSION = /\.js$/u;

export interface ModuleBuildOptions {
  /** Absolute package root. */
  root: string;
  /** Source directory relative to the package root. */
  source: string;
  /** Output directory relative to the package root. */
  output: string;
  /** Stale files to remove relative to the package root. */
  clean?: string[];
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

function isSourceFile(file: string): boolean {
  return (
    SOURCE_EXTENSIONS.some((extension) => file.endsWith(extension)) &&
    !file.endsWith(".d.ts") &&
    !file.includes(".test.")
  );
}

function outputPath(sourceFile: string, options: ModuleBuildOptions): string {
  const relativePath = relative(join(options.root, options.source), sourceFile);
  return join(options.root, options.output, relativePath.replace(TYPESCRIPT_EXTENSION, ".js"));
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

/**
 * Standalone modules are consumed directly as ESM. TypeScript keeps
 * extensionless relative imports, so add the runtime `.js` extension here.
 */
async function rewriteRelativeImports(code: string, sourceFile: string): Promise<string> {
  let result = "";
  let lastIndex = 0;

  for (const match of code.matchAll(RUNTIME_IMPORT)) {
    const [full, quote, specifier] = match;
    if (quote === undefined || specifier === undefined || RESOLVED_MODULE.test(specifier)) {
      continue;
    }
    const base = resolve(dirname(sourceFile), specifier);
    let replacement = full;
    if ((await pathExists(`${base}.ts`)) || (await pathExists(`${base}.tsx`))) {
      replacement = `from ${quote}${specifier}.js${quote}`;
    } else if (
      (await pathExists(join(base, "index.ts"))) ||
      (await pathExists(join(base, "index.tsx")))
    ) {
      replacement = `from ${quote}${specifier}${specifier.endsWith("/") ? "" : "/"}index.js${quote}`;
    }
    if (replacement !== full) {
      const index = match.index ?? 0;
      result += code.slice(lastIndex, index) + replacement;
      lastIndex = index + full.length;
    }
  }

  return result + code.slice(lastIndex);
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

export async function buildModules(options: ModuleBuildOptions): Promise<number> {
  const sourceDirectory = join(options.root, options.source);
  const sourceFiles = (await walk(sourceDirectory)).filter((file) => isSourceFile(file));

  await rm(join(options.root, options.output), { recursive: true, force: true });
  for (const file of options.clean ?? []) {
    await rm(join(options.root, file), { force: true });
  }

  for (const sourceFile of sourceFiles) {
    const source = await readFile(sourceFile, "utf8");
    const compilerOptions = {
      module: ModuleKind.ESNext,
      target: ScriptTarget.ES2022,
    };
    const js = await rewriteRelativeImports(
      transpileModule(source, { compilerOptions }).outputText,
      sourceFile,
    );
    const declaration = await rewriteRelativeImports(
      transpileDeclaration(source, {
        compilerOptions: { ...compilerOptions, declaration: true, emitDeclarationOnly: true },
      }).outputText,
      sourceFile,
    );
    const file = outputPath(sourceFile, options);
    await writeIfChanged(file, js);
    await writeIfChanged(file.replace(JAVASCRIPT_EXTENSION, ".d.ts"), declaration);
  }

  return sourceFiles.length;
}

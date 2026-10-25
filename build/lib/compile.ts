/// <reference types="node" />
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { ModuleKind, ScriptTarget, transpileDeclaration, transpileModule } from "typescript";

const SOURCE_EXTENSIONS = [".ts", ".tsx"] as const;
const RUNTIME_IMPORT = /\bfrom\s+(["'])(\.[^"']+)\1/g;

export interface ModuleBuildOptions {
  /** Absolute repository root. */
  root: string;
  /** Source directory relative to the repository root. */
  source: string;
  /** Output directory relative to the repository root. */
  output: string;
  /** Stale files to remove relative to the repository root. */
  clean?: string[];
}

function walk(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
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
  return join(options.root, options.output, relativePath.replace(/\.tsx?$/u, ".js"));
}

/**
 * Standalone modules are consumed directly as ESM. TypeScript keeps
 * extensionless relative imports, so add the runtime `.js` extension here.
 */
function rewriteRelativeImports(code: string, sourceFile: string): string {
  return code.replaceAll(RUNTIME_IMPORT, (match, quote: string, specifier: string) => {
    if (/\.(?:[cm]?js|jsx|ts|tsx|json|css)$/u.test(specifier)) {
      return match;
    }
    const base = resolve(dirname(sourceFile), specifier);
    if (existsSync(`${base}.ts`) || existsSync(`${base}.tsx`)) {
      return `from ${quote}${specifier}.js${quote}`;
    }
    if (existsSync(join(base, "index.ts")) || existsSync(join(base, "index.tsx"))) {
      return `from ${quote}${specifier}${specifier.endsWith("/") ? "" : "/"}index.js${quote}`;
    }
    return match;
  });
}

function writeIfChanged(file: string, contents: string): void {
  if (existsSync(file) && readFileSync(file, "utf8") === contents) {
    return;
  }
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, contents);
}

export function buildModules(options: ModuleBuildOptions): number {
  const sourceDirectory = join(options.root, options.source);
  const sourceFiles = walk(sourceDirectory).filter((file) => isSourceFile(file));

  rmSync(join(options.root, options.output), { recursive: true, force: true });
  for (const file of options.clean ?? []) {
    rmSync(join(options.root, file), { force: true });
  }

  for (const sourceFile of sourceFiles) {
    const source = readFileSync(sourceFile, "utf8");
    const compilerOptions = {
      module: ModuleKind.ESNext,
      target: ScriptTarget.ES2022,
    };
    const js = rewriteRelativeImports(
      transpileModule(source, { compilerOptions }).outputText,
      sourceFile,
    );
    const declaration = rewriteRelativeImports(
      transpileDeclaration(source, {
        compilerOptions: { ...compilerOptions, declaration: true, emitDeclarationOnly: true },
      }).outputText,
      sourceFile,
    );
    const file = outputPath(sourceFile, options);
    writeIfChanged(file, js);
    writeIfChanged(file.replace(/\.js$/u, ".d.ts"), declaration);
  }

  return sourceFiles.length;
}

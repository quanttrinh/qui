import { normalizeComponentTags } from "@quanttrinh/qui/internal";
import { MagicString } from "magic-string";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createUnplugin, type TransformResult, type UnpluginInstance } from "unplugin";

import {
  componentsFromVirtualModuleId,
  createExternalStylesModule,
  createRegistrationModule,
  createStylesModule,
  ensureStylesheetLinks,
  extractComponents,
  importInjectionOffset,
  isExternalStyles,
  isStylesHrefValue,
  isTransformableId,
  markStylesheetLinks,
  mayContainComponents,
  resolveStylesheetHrefCandidates,
  resolveStylesheetHrefs,
  virtualModuleId,
  VIRTUAL_REGISTRATION_MANIFEST_ID,
  VIRTUAL_STYLES_ID,
  type QuiPluginOptions,
  type QuiRegistrationOptions,
  type QuiStylesBundleAsset,
  type QuiStylesResolverContext,
} from "./core";
import { resolveStylesheetPath } from "./resolve-styles";

export type {
  EnsureStylesheetLinksOptions,
  QuiPluginOptions,
  QuiRegistrationOptions,
  QuiStylesBundleAsset,
  QuiStylesHref,
  QuiStylesHrefResolver,
  QuiStylesHrefValue,
  QuiStylesOptions,
  QuiStylesResolverContext,
} from "./core";
export {
  ensureStylesheetLinks,
  markStylesheetLinks,
  resolveStylesheetHrefs,
  VIRTUAL_REGISTRATION_MANIFEST_ID,
} from "./core";

const PLUGIN_NAME = "unplugin-qui";
const RESOLVED_VIRTUAL_STYLES_ID = `\0${VIRTUAL_STYLES_ID}`;
const RESOLVED_VIRTUAL_REGISTRATION_MANIFEST_ID = `\0${VIRTUAL_REGISTRATION_MANIFEST_ID}`;
const COMPONENT_SOURCE = ["qui-", String.raw`\u`, String.raw`\x`] as const;
const COMPONENT_CACHE_LIMIT = 128;

function parseManifestComponents(value: unknown): string[] {
  let components: unknown = value;
  if (!Array.isArray(components)) {
    components =
      typeof value === "object" && value !== null && "components" in value
        ? Reflect.get(value, "components")
        : undefined;
  }

  if (
    !Array.isArray(components) ||
    !components.every((component): component is string => typeof component === "string")
  ) {
    throw new Error(
      "qui registration manifest must be an array of component tags or an object with a components array.",
    );
  }
  return normalizeComponentTags(components);
}

async function readRegistrationManifest(
  file: string,
  addWatchFile: ((id: string) => void) | undefined,
): Promise<string[]> {
  addWatchFile?.(file);
  let contents: string;
  try {
    contents = await readFile(file, "utf8");
  } catch (error) {
    throw new Error(`qui registration manifest could not be read: ${file}`, { cause: error });
  }

  try {
    return parseManifestComponents(JSON.parse(contents));
  } catch (error) {
    throw new Error(`qui registration manifest is invalid: ${file}`, { cause: error });
  }
}

/** Writes a registration manifest that `virtual:qui/registration-manifest` reads. */
export async function writeRegistrationManifest(
  file: string,
  components: Iterable<string>,
): Promise<string> {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(
    file,
    `${JSON.stringify({ components: normalizeComponentTags(components) }, null, 2)}\n`,
  );
  return file;
}

function validateRegistration(registration: QuiRegistrationOptions | undefined): void {
  const components: unknown = registration?.components;
  if (
    components !== undefined &&
    (!Array.isArray(components) || !components.every((component) => typeof component === "string"))
  ) {
    throw new Error("qui registration components must be an array of component tags.");
  }
}

function isBundle(value: unknown): value is Readonly<Record<string, QuiStylesBundleAsset>> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validateStylesHref(styles: QuiPluginOptions["styles"]): void {
  const value: unknown = styles;
  if (typeof value === "object" && value !== null && "href" in value) {
    const href: unknown = Reflect.get(value, "href");
    if (href !== undefined && !isStylesHrefValue(href)) {
      throw new Error(
        "qui external styles href must be a string, string array, or resolver function.",
      );
    }
  }
  if (!isExternalStyles(styles) || typeof styles.href === "function") {
    return;
  }
  const values = Array.isArray(styles.href) ? styles.href : [styles.href];
  if (!values.some((entry) => entry.length > 0)) {
    throw new Error("qui external styles require at least one non-empty href.");
  }
}

function validateStylesOptions(styles: QuiPluginOptions["styles"], framework: string): void {
  validateStylesHref(styles);
  if (isExternalStyles(styles) && framework !== "vite") {
    throw new Error(
      "qui external styles require Vite; use styles: false and mark the document link yourself for other bundlers.",
    );
  }
}

const stylesheetTextCache = new Map<string, Promise<string>>();

/** Reads the shared stylesheet when the virtual styles module is loaded. */
async function getStylesheetText(): Promise<string> {
  const file = resolveStylesheetPath();
  const cached = stylesheetTextCache.get(file);
  if (cached !== undefined) {
    return cached;
  }

  const promise = readFile(file, "utf8");
  stylesheetTextCache.set(file, promise);
  try {
    return await promise;
  } catch (error) {
    if (stylesheetTextCache.get(file) === promise) {
      stylesheetTextCache.delete(file);
    }
    throw error;
  }
}

/**
 * Resolves external styles and marks matching document stylesheet links.
 *
 * Vite calls this from `transformIndexHtml`. SSR/SSG pipelines that render HTML
 * outside Vite's HTML transform can call it directly with the build manifest
 * (or a resolver) so the emitted, possibly hashed, link is marked before the
 * response is sent.
 */
export async function markExternalStylesheetLinks(
  html: string,
  styles: QuiPluginOptions["styles"],
  context: QuiStylesResolverContext,
): Promise<string> {
  validateStylesHref(styles);
  if (!isExternalStyles(styles)) {
    return html;
  }
  const hrefs = await resolveStylesheetHrefCandidates(styles.href, context);
  return markStylesheetLinks(html, hrefs);
}

/**
 * Resolves external styles and ensures every resolved URL has a marked document
 * stylesheet link, inserting missing links into the document head. This matches
 * the SSR helper's document-link behavior for pipelines that build complete HTML
 * outside Vite's HTML transform.
 */
export async function ensureExternalStylesheetLinks(
  html: string,
  styles: QuiPluginOptions["styles"],
  context: QuiStylesResolverContext,
): Promise<string> {
  validateStylesHref(styles);
  if (!isExternalStyles(styles)) {
    return html;
  }
  const hrefs = await resolveStylesheetHrefs(styles.href, context);
  return ensureStylesheetLinks(html, hrefs);
}

const unplugin: UnpluginInstance<QuiPluginOptions | undefined, false> = createUnplugin<
  QuiPluginOptions | undefined
>((options, meta: { framework: string }) => {
  const pluginOptions = options ?? {};
  validateStylesOptions(pluginOptions.styles, meta.framework);
  validateRegistration(pluginOptions.registration);
  const componentCache = new Map<string, { code: string; components: string[] }>();
  const pendingComponents = new Map<string, { code: string; promise: Promise<string[]> }>();
  const externalStyles = isExternalStyles(pluginOptions.styles) ? pluginOptions.styles : undefined;
  let viteBase = "/";
  let viteCommand: "serve" | "build" = "build";
  let viteMode = "production";
  let viteIsSsrBuild = false;
  let viteRoot = process.cwd();

  async function extractComponentsCached(code: string, id: string): Promise<string[]> {
    const cached = componentCache.get(id);
    if (cached?.code === code) {
      return cached.components;
    }

    if (!mayContainComponents(code)) {
      componentCache.delete(id);
      pendingComponents.delete(id);
      return [];
    }

    const pending = pendingComponents.get(id);
    if (pending?.code === code) {
      return pending.promise;
    }

    const promise = extractComponents(code, id);
    pendingComponents.set(id, { code, promise });
    try {
      const components = await promise;
      if (componentCache.size >= COMPONENT_CACHE_LIMIT) {
        const oldest = componentCache.keys().next().value;
        if (oldest !== undefined) {
          componentCache.delete(oldest);
        }
      }
      componentCache.set(id, { code, components });
      return components;
    } finally {
      if (pendingComponents.get(id)?.promise === promise) {
        pendingComponents.delete(id);
      }
    }
  }

  return {
    name: PLUGIN_NAME,
    enforce: "pre",
    vite: {
      configResolved(config: {
        base: string;
        root?: string;
        command?: "serve" | "build";
        mode?: string;
        isSsrBuild?: boolean;
        build?: { ssr?: boolean | string };
      }): void {
        viteBase = config.base;
        viteRoot = config.root ?? viteRoot;
        viteCommand = config.command ?? "build";
        viteMode = config.mode ?? "production";
        viteIsSsrBuild = Boolean(config.isSsrBuild ?? config.build?.ssr);
      },
      transformIndexHtml: {
        order: "post",
        handler(
          html: string,
          context: {
            path?: string;
            filename?: string;
            bundle?: unknown;
            server?: unknown;
          } = {},
        ): string | Promise<string> {
          if (!externalStyles) {
            return html;
          }
          return markExternalStylesheetLinks(html, externalStyles, {
            command: viteCommand,
            mode: viteMode,
            base: viteBase,
            isSsrBuild: viteIsSsrBuild,
            path: context.path,
            filename: context.filename,
            bundle: isBundle(context.bundle) ? context.bundle : undefined,
            server: context.server,
          });
        },
      },
    },
    resolveId: {
      handler(id: string): string | undefined {
        if (id === VIRTUAL_STYLES_ID) {
          return RESOLVED_VIRTUAL_STYLES_ID;
        }
        if (id === VIRTUAL_REGISTRATION_MANIFEST_ID) {
          return RESOLVED_VIRTUAL_REGISTRATION_MANIFEST_ID;
        }
        if (componentsFromVirtualModuleId(id) === undefined) {
          return undefined;
        }
        return `\0${id}`;
      },
    },
    load: {
      async handler(
        this: { addWatchFile?: (id: string) => void },
        id: string,
      ): Promise<string | undefined> {
        if (id === RESOLVED_VIRTUAL_STYLES_ID) {
          if (isExternalStyles(pluginOptions.styles)) {
            return createExternalStylesModule(pluginOptions.styles);
          }
          this.addWatchFile?.(resolveStylesheetPath());
          return createStylesModule(await getStylesheetText(), pluginOptions.styles);
        }
        if (id === RESOLVED_VIRTUAL_REGISTRATION_MANIFEST_ID) {
          const { registration } = pluginOptions;
          const { manifest } = registration ?? {};
          let manifestComponents: string[] = [];
          if (manifest !== undefined) {
            const manifestFile = path.isAbsolute(manifest)
              ? manifest
              : path.resolve(viteRoot, manifest);
            manifestComponents = await readRegistrationManifest(
              manifestFile,
              this.addWatchFile?.bind(this),
            );
          }
          const components = normalizeComponentTags([
            ...manifestComponents,
            ...(registration?.components ?? []),
          ]);
          return createRegistrationModule(components, pluginOptions);
        }
        const components = componentsFromVirtualModuleId(id.slice(1));
        if (!components?.length) {
          return undefined;
        }
        return createRegistrationModule(components, pluginOptions);
      },
    },
    transform: {
      filter: { code: { include: [...COMPONENT_SOURCE] } },
      async handler(code: string, id: string): Promise<TransformResult> {
        if (!isTransformableId(id)) {
          return undefined;
        }
        const components = await extractComponentsCached(code, id);
        if (components.length === 0) {
          return undefined;
        }

        const specifier = virtualModuleId(components);
        const source = new MagicString(code);
        const importStatement = `import ${JSON.stringify(specifier)};\n`;
        const offset = importInjectionOffset(code);
        if (offset === 0) {
          source.prepend(importStatement);
        } else {
          // A frontmatter block may end at EOF without a trailing newline.
          const separator = code.slice(0, offset).endsWith("\n") ? "" : "\n";
          source.appendLeft(offset, `${separator}${importStatement}`);
        }
        return {
          code: source.toString(),
          map: source.generateMap({ hires: "boundary", includeContent: false, source: id }),
        };
      },
    },
  };
});

type QuiUnplugin = UnpluginInstance<QuiPluginOptions | undefined, false>;

export const vite: QuiUnplugin["vite"] = unplugin.vite;
export const rollup: QuiUnplugin["rollup"] = unplugin.rollup;
export const webpack: QuiUnplugin["webpack"] = unplugin.webpack;
export const rspack: QuiUnplugin["rspack"] = unplugin.rspack;
export const esbuild: QuiUnplugin["esbuild"] = unplugin.esbuild;

export default unplugin;

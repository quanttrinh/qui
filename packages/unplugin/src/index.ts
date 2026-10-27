import { MagicString } from "magic-string";
import { readFile } from "node:fs/promises";
import { createUnplugin, type TransformResult, type UnpluginInstance } from "unplugin";

import {
  componentsFromVirtualModuleId,
  createExternalStylesModule,
  createRegistrationModule,
  createStylesModule,
  extractComponents,
  importInjectionOffset,
  isExternalStyles,
  isStylesHrefValue,
  isTransformableId,
  markStylesheetLinks,
  mayContainComponents,
  resolveStylesheetHrefCandidates,
  virtualModuleId,
  VIRTUAL_STYLES_ID,
  type QuiPluginOptions,
  type QuiStylesBundleAsset,
  type QuiStylesResolverContext,
} from "./core";
import { resolveStylesheetPath } from "./resolve-styles";

export type {
  QuiPluginOptions,
  QuiStylesBundleAsset,
  QuiStylesHref,
  QuiStylesHrefResolver,
  QuiStylesHrefValue,
  QuiStylesOptions,
  QuiStylesResolverContext,
} from "./core";
export { markStylesheetLinks, resolveStylesheetHrefs } from "./core";

const PLUGIN_NAME = "unplugin-qui";
const RESOLVED_VIRTUAL_STYLES_ID = `\0${VIRTUAL_STYLES_ID}`;
const COMPONENT_SOURCE = ["qui-", String.raw`\u`, String.raw`\x`] as const;
const COMPONENT_CACHE_LIMIT = 128;

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

/** Reads the shared stylesheet when the virtual styles module is loaded. */
async function getStylesheetText(): Promise<string> {
  const text = await readFile(resolveStylesheetPath(), "utf8");
  return text;
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

const unplugin: UnpluginInstance<QuiPluginOptions | undefined, false> = createUnplugin<
  QuiPluginOptions | undefined
>((options, meta: { framework: string }) => {
  const pluginOptions = options ?? {};
  validateStylesOptions(pluginOptions.styles, meta.framework);
  const componentCache = new Map<string, { code: string; components: string[] }>();
  const externalStyles = isExternalStyles(pluginOptions.styles) ? pluginOptions.styles : undefined;
  let viteBase = "/";
  let viteCommand: "serve" | "build" = "build";
  let viteMode = "production";
  let viteIsSsrBuild = false;

  function extractComponentsCached(code: string, id: string): string[] {
    const cached = componentCache.get(id);
    if (cached?.code === code) {
      return cached.components;
    }

    if (!mayContainComponents(code)) {
      componentCache.delete(id);
      return [];
    }

    const components = extractComponents(code, id);
    if (componentCache.size >= COMPONENT_CACHE_LIMIT) {
      const oldest = componentCache.keys().next().value;
      if (oldest !== undefined) {
        componentCache.delete(oldest);
      }
    }
    componentCache.set(id, { code, components });
    return components;
  }

  return {
    name: PLUGIN_NAME,
    enforce: "pre",
    vite: {
      configResolved(config: {
        base: string;
        command?: "serve" | "build";
        mode?: string;
        isSsrBuild?: boolean;
        build?: { ssr?: boolean | string };
      }): void {
        viteBase = config.base;
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
        const components = componentsFromVirtualModuleId(id.slice(1));
        if (components === undefined || components.length === 0) {
          return undefined;
        }
        return createRegistrationModule(components, pluginOptions);
      },
    },
    transform: {
      filter: { code: { include: [...COMPONENT_SOURCE] } },
      handler(code: string, id: string): TransformResult {
        if (!isTransformableId(id)) {
          return undefined;
        }
        const components = extractComponentsCached(code, id);
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

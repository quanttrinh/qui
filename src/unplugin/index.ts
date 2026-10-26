import { MagicString } from "magic-string";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { createUnplugin, type TransformResult, type UnpluginInstance } from "unplugin";

import {
  componentsFromVirtualModuleId,
  createExternalStylesModule,
  createRegistrationModule,
  createStylesModule,
  extractComponents,
  importInjectionOffset,
  isExternalStyles,
  isTransformableId,
  markStylesheetLinks,
  mayContainComponents,
  virtualModuleId,
  VIRTUAL_STYLES_ID,
  type QuiPluginOptions,
} from "./core";

export type { QuiPluginOptions, QuiStylesOptions } from "./core";

const PLUGIN_NAME = "unplugin-qui";
const RESOLVED_VIRTUAL_STYLES_ID = `\0${VIRTUAL_STYLES_ID}`;
const VIRTUAL_MODULE_FILTER = /^virtual:qui\/(?:register|styles)(?:[?#]|$)/u;
const RESOLVED_VIRTUAL_MODULE_FILTER = /^\0virtual:qui\/(?:register|styles)(?:[?#]|$)/u;
const STYLESHEET_PATH = fileURLToPath(new URL("../../styled-system/styles.css", import.meta.url));
const TRANSFORMABLE_ID = /\.(?:[cm]?[jt]sx?|mdx)(?:[?#]|$)/u;
const COMPONENT_SOURCE = /qui-|\\[ux]/u;
const IGNORED_ID = /(?:^|[\\/])node_modules[\\/]|^(?:virtual:|\0)/u;
const COMPONENT_CACHE_LIMIT = 128;

/** Reads the shared stylesheet when the virtual styles module is loaded. */
async function getStylesheetText(): Promise<string> {
  const text = await readFile(STYLESHEET_PATH, "utf8");
  return text;
}

const unplugin: UnpluginInstance<QuiPluginOptions | undefined, false> = createUnplugin<
  QuiPluginOptions | undefined
>((options, meta: { framework: string }) => {
  const pluginOptions = options ?? {};
  if (isExternalStyles(pluginOptions.styles)) {
    const configured = pluginOptions.styles.href;
    const values = Array.isArray(configured) ? configured : [configured];
    if (!values.some((value) => value.length > 0)) {
      throw new Error("qui external styles require at least one non-empty href.");
    }
  }
  if (isExternalStyles(pluginOptions.styles) && meta.framework !== "vite") {
    throw new Error(
      "qui external styles require Vite or an Astro integration; use styles: false and mark the document link yourself for other bundlers.",
    );
  }
  const componentCache = new Map<string, { code: string; components: string[] }>();
  const externalStyles = isExternalStyles(pluginOptions.styles) ? pluginOptions.styles : undefined;

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
      transformIndexHtml: {
        order: "post",
        handler(html: string): string {
          return externalStyles ? markStylesheetLinks(html, externalStyles.href) : html;
        },
      },
    },
    resolveId: {
      filter: { id: VIRTUAL_MODULE_FILTER },
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
      filter: { id: RESOLVED_VIRTUAL_MODULE_FILTER },
      async handler(
        this: { addWatchFile?: (id: string) => void },
        id: string,
      ): Promise<string | undefined> {
        if (id === RESOLVED_VIRTUAL_STYLES_ID) {
          if (isExternalStyles(pluginOptions.styles)) {
            return createExternalStylesModule(pluginOptions.styles);
          }
          this.addWatchFile?.(STYLESHEET_PATH);
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
      filter: { id: { include: TRANSFORMABLE_ID, exclude: IGNORED_ID }, code: COMPONENT_SOURCE },
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

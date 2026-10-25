import { MagicString } from "magic-string";
import { createUnplugin, type TransformResult, type UnpluginInstance } from "unplugin";

import {
  componentsFromVirtualModuleId,
  createRegistrationModule,
  extractComponents,
  isTransformableId,
  mayContainComponents,
  virtualModuleId,
  VIRTUAL_MODULE_ID,
  type QuiPluginOptions,
} from "./core";

export type { QuiPluginOptions, QuiStrategy } from "./core";

const PLUGIN_NAME = "unplugin-qui";
const RESOLVED_VIRTUAL_MODULE_ID = `\0${VIRTUAL_MODULE_ID}`;
const VIRTUAL_MODULE_FILTER = /^virtual:qui\/register(?:[?#]|$)/u;
const RESOLVED_VIRTUAL_MODULE_FILTER = /^\0virtual:qui\/register(?:[?#]|$)/u;
const TRANSFORMABLE_ID = /\.(?:[cm]?[jt]sx?|astro|mdx)(?:[?#]|$)/u;
const COMPONENT_SOURCE = /qui-|\\[ux]/u;
const IGNORED_ID = /(?:^|[\\/])node_modules[\\/]|^(?:virtual:|\0)/u;
const COMPONENT_CACHE_LIMIT = 128;

const unplugin: UnpluginInstance<QuiPluginOptions | undefined, false> = createUnplugin<
  QuiPluginOptions | undefined
>((options = {}) => {
  const strategy = options.strategy ?? "shared";
  const componentCache = new Map<string, { code: string; components: string[] }>();

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
    resolveId: {
      filter: { id: VIRTUAL_MODULE_FILTER },
      handler(id: string): string | undefined {
        if (componentsFromVirtualModuleId(id) === undefined) {
          return undefined;
        }
        return `\0${id}`;
      },
    },
    load: {
      filter: { id: RESOLVED_VIRTUAL_MODULE_FILTER },
      handler(id: string): string | undefined {
        if (!id.startsWith(RESOLVED_VIRTUAL_MODULE_ID)) {
          return undefined;
        }
        const components = componentsFromVirtualModuleId(id.slice(1));
        if (components === undefined || components.length === 0) {
          return undefined;
        }
        return createRegistrationModule(components, { ...options, strategy });
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
        source.prepend(`import ${JSON.stringify(specifier)};\n`);
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

import { MagicString } from "magic-string";
import { createUnplugin, type TransformResult, type UnpluginInstance } from "unplugin";

import {
  componentsFromVirtualModuleId,
  createRegistrationModule,
  extractComponents,
  isTransformableId,
  virtualModuleId,
  VIRTUAL_MODULE_ID,
  type QuiPluginOptions,
} from "./core";

export type { QuiPluginOptions, QuiStrategy } from "./core";

const PLUGIN_NAME = "unplugin-qui";
const RESOLVED_VIRTUAL_MODULE_ID = `\0${VIRTUAL_MODULE_ID}`;

const unplugin: UnpluginInstance<QuiPluginOptions | undefined, false> = createUnplugin<
  QuiPluginOptions | undefined
>((options = {}) => {
  const strategy = options.strategy ?? "shared";

  return {
    name: PLUGIN_NAME,
    enforce: "pre",
    resolveId(id: string): string | undefined {
      if (componentsFromVirtualModuleId(id) === undefined) {
        return undefined;
      }
      return `\0${id}`;
    },
    load(id: string): string | undefined {
      if (!id.startsWith(RESOLVED_VIRTUAL_MODULE_ID)) {
        return undefined;
      }
      const components = componentsFromVirtualModuleId(id.slice(1));
      if (components === undefined || components.length === 0) {
        return undefined;
      }
      return createRegistrationModule(components, { ...options, strategy });
    },
    transform(code: string, id: string): TransformResult {
      if (!isTransformableId(id)) {
        return undefined;
      }
      const components = extractComponents(code, id);
      if (components.length === 0) {
        return undefined;
      }

      const specifier = virtualModuleId(components);
      const source = new MagicString(code);
      source.prepend(`import ${JSON.stringify(specifier)};\n`);
      return {
        code: source.toString(),
        map: source.generateMap({ hires: true, source: id }),
      };
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

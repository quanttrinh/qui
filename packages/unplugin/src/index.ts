import { MagicString } from "magic-string";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
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
const requireFromPlugin = createRequire(import.meta.url);
const COMPONENT_SOURCE = ["qui-", String.raw`\u`, String.raw`\x`] as const;
const COMPONENT_CACHE_LIMIT = 128;

function withViteBase(href: string | string[], base: string): string[] {
  const values = Array.isArray(href) ? href : [href];
  if (base === "" || base === "/" || base.startsWith("./")) {
    return values;
  }
  const normalizedBase = base.endsWith("/") ? base : `${base}/`;
  return values.flatMap((value) => {
    if (!value.startsWith("/") || value.startsWith("//")) {
      return [value];
    }
    return [value, `${normalizedBase}${value.slice(1)}`];
  });
}

/** Resolves the main package's shared stylesheet through its public export. */
function resolveStylesheetPath(): string {
  try {
    return requireFromPlugin.resolve("@quanttrinh/qui/styles.css");
  } catch {
    throw new Error(
      "@quanttrinh/qui-unplugin requires @quanttrinh/qui to be installed alongside it.",
    );
  }
}

/** Reads the shared stylesheet when the virtual styles module is loaded. */
async function getStylesheetText(): Promise<string> {
  const text = await readFile(resolveStylesheetPath(), "utf8");
  return text;
}

const unplugin: UnpluginInstance<QuiPluginOptions | undefined, false> = createUnplugin<
  QuiPluginOptions | undefined
>((options, meta: { framework: string }) => {
  const pluginOptions = options ?? {};
  const stylesValue: unknown = pluginOptions.styles;
  if (
    typeof stylesValue === "object" &&
    stylesValue !== null &&
    "href" in stylesValue &&
    Reflect.get(stylesValue, "href") !== undefined &&
    !isExternalStyles(pluginOptions.styles)
  ) {
    throw new Error("qui external styles href must be a string or string array.");
  }
  if (isExternalStyles(pluginOptions.styles)) {
    const configured = pluginOptions.styles.href;
    const values = Array.isArray(configured) ? configured : [configured];
    if (!values.some((value) => value.length > 0)) {
      throw new Error("qui external styles require at least one non-empty href.");
    }
  }
  if (isExternalStyles(pluginOptions.styles) && meta.framework !== "vite") {
    throw new Error(
      "qui external styles require Vite; use styles: false and mark the document link yourself for other bundlers.",
    );
  }
  const componentCache = new Map<string, { code: string; components: string[] }>();
  const externalStyles = isExternalStyles(pluginOptions.styles) ? pluginOptions.styles : undefined;
  let viteBase = "/";

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
      configResolved(config: { base: string }): void {
        viteBase = config.base;
      },
      transformIndexHtml: {
        order: "post",
        handler(html: string): string {
          return externalStyles
            ? markStylesheetLinks(html, withViteBase(externalStyles.href, viteBase))
            : html;
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

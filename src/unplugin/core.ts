import { extractComponentsFromJavaScript, extractComponentsFromText } from "./extract";

export type QuiStrategy = "shared" | "split";

export interface QuiPluginOptions {
  /**
   * Distribution to register. Defaults to `"shared"`.
   */
  strategy?: QuiStrategy;
  /**
   * Emit the CSS imports that match the selected distribution. Defaults to
   * `true`.
   */
  styles?: boolean;
}

const COMPONENT_TAG_NAME = /^qui-[a-z0-9]+(?:-[a-z0-9]+)*$/u;
const JAVASCRIPT_FILE = /\.(?:[cm]?[jt]sx?)$/u;
const TRANSFORMABLE_FILE = /\.(?:[cm]?[jt]sx?|astro|mdx)$/u;

export const VIRTUAL_MODULE_ID = "virtual:qui/register";

/**
 * Finds opening component tags in JavaScript-family source using Oxc's AST,
 * with a lexical fallback for Astro, MDX, and files the parser rejects.
 */
export function extractComponents(code: string, id = "component.tsx"): string[] {
  const file = (id.split("?")[0] ?? id).replaceAll("\\", "/");
  if (JAVASCRIPT_FILE.test(file)) {
    return extractComponentsFromJavaScript(code, file) ?? extractComponentsFromText(code);
  }
  return extractComponentsFromText(code);
}

export function normalizeComponents(components: Iterable<string>): string[] {
  const normalized = new Set<string>();
  for (const component of components) {
    if (COMPONENT_TAG_NAME.test(component)) {
      normalized.add(component);
    }
  }
  return [...normalized].sort();
}

export function virtualModuleId(components: Iterable<string>): string {
  const tags = normalizeComponents(components);
  return `${VIRTUAL_MODULE_ID}?components=${tags.map((tag) => encodeURIComponent(tag)).join(",")}`;
}

export function componentsFromVirtualModuleId(id: string): string[] | undefined {
  if (!id.startsWith(`${VIRTUAL_MODULE_ID}?`)) {
    return undefined;
  }
  const query = id.slice(id.indexOf("?") + 1);
  const value = new URLSearchParams(query).get("components");
  return value === null ? [] : normalizeComponents(value.split(","));
}

export function isTransformableId(id: string): boolean {
  if (id.startsWith("\0") || id.startsWith("virtual:")) {
    return false;
  }
  const file = (id.split("?")[0] ?? id).replaceAll("\\", "/");
  if (file.startsWith("node_modules/") || file.includes("/node_modules/")) {
    return false;
  }
  return TRANSFORMABLE_FILE.test(file);
}

export function createRegistrationModule(
  components: Iterable<string>,
  options: QuiPluginOptions = {},
): string {
  const strategy: string = options.strategy ?? "shared";
  if (strategy !== "shared" && strategy !== "split") {
    throw new Error(`[unplugin-qui] Unknown strategy "${strategy}". Expected "shared" or "split".`);
  }

  const tags = normalizeComponents(components);
  if (tags.length === 0) {
    return "";
  }

  const bindings: string[] = [];
  const lines = ['import { defineComponents } from "@quanttrinh/qui/register";'];

  for (const [index, tag] of tags.entries()) {
    const binding = `__qui_${index}`;
    bindings.push(binding);
    lines.push(
      `import { defineCustomElement as ${binding} } from "@quanttrinh/qui/${strategy}/${tag}";`,
    );
  }

  if (options.styles !== false) {
    lines.push(
      'import "@quanttrinh/qui/theme.css";',
      strategy === "shared"
        ? 'import "@quanttrinh/qui/styles.css";'
        : 'import "@quanttrinh/qui/base.css";',
    );
    if (strategy === "split") {
      lines.push(...tags.map((tag) => `import "@quanttrinh/qui/split/components/${tag}.css";`));
    }
  }

  lines.push(`defineComponents(${bindings.join(", ")});`);

  return `${lines.join("\n")}\n`;
}

/// <reference types="node" />
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { type Config } from "../config";
import { componentDeclarationsFromSource } from "./component-tags";

/**
 * Collects the tags of components marked with `@undefinedContent` in their
 * class documentation. The marker keeps the metadata beside the component
 * instead of duplicating its tag in a build-time list.
 */
function undefinedContentTags(config: Config): string[] {
  const tags = new Set<string>();

  for (const file of readdirSync(config.source.components, { encoding: "utf8", recursive: true })) {
    if (!file.endsWith(".tsx")) {
      continue;
    }
    const path = join(config.source.components, file);
    const source = readFileSync(path, "utf8");
    if (!source.includes("@undefinedContent")) {
      continue;
    }

    for (const declaration of componentDeclarationsFromSource(source)) {
      if (declaration.undefinedContent) {
        tags.add(declaration.tag);
      }
    }
  }

  return [...tags].sort();
}

/**
 * Suppresses content while its custom element is undefined, but keeps
 * server-rendered hosts visible through Stencil's `hydrated` marker.
 */
function undefinedContentSelector(config: Config): string {
  const tags = undefinedContentTags(config);
  const selector = tags.length === 0 ? ":where(:not(*))" : `:where(${tags.join(", ")})`;
  return `${selector}:not(:defined):not(.hydrated)`;
}

export { undefinedContentSelector, undefinedContentTags };

/// <reference types="node" />
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { type Config } from "../config";

const UNDEFINED_CONTENT_COMPONENT =
  /@undefinedContent[\s\S]*?@Component\s*\(\s*\{[\s\S]*?\btag:\s*"([^"]+)"/u;

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
    const match = UNDEFINED_CONTENT_COMPONENT.exec(readFileSync(path, "utf8"));
    if (match?.[1] !== undefined) {
      tags.add(match[1]);
    }
  }

  return [...tags].sort();
}

/**
 * Suppresses content while its custom element is undefined, but keeps
 * server-rendered hosts visible through Stencil's `hydrated` marker.
 */
function undefinedContentSelector(config: Config): string {
  return `:where(${undefinedContentTags(config).join(", ")}):not(:defined):not(.hydrated)`;
}

export { undefinedContentSelector, undefinedContentTags };

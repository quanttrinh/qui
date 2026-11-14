#!/usr/bin/env bun
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

export type BumpType = "patch" | "minor" | "major";

export interface ManifestInput {
  readonly path: string;
  readonly base: Record<string, unknown>;
  readonly head: Record<string, unknown>;
}

export interface ReleaseChange {
  readonly name: string;
  readonly bump: BumpType;
  readonly summary: readonly string[];
}

const VERSION_PATTERN = /\d+\.\d+\.\d+/u;
const DEPENDENCY_SECTIONS = [
  "dependencies",
  "optionalDependencies",
  "peerDependencies",
  "resolutions",
] as const;
const BUMP_RANK: Record<BumpType, number> = { patch: 0, minor: 1, major: 2 };

function parseVersion(range: string | undefined): readonly number[] | undefined {
  const match = range === undefined ? null : VERSION_PATTERN.exec(range);
  return match === null ? undefined : match[0].split(".").map(Number);
}

/** Classifies a dependency range change by semver component. */
export function classifyRangeChange(
  previous: string | undefined,
  next: string | undefined,
): BumpType {
  const oldVersion = parseVersion(previous);
  const newVersion = parseVersion(next);
  if (oldVersion === undefined || newVersion === undefined) {
    return "patch";
  }
  if (oldVersion[0] !== newVersion[0]) {
    return "major";
  }
  if (oldVersion[1] !== newVersion[1]) {
    return "minor";
  }
  return "patch";
}

function maxBump(current: BumpType | undefined, next: BumpType): BumpType {
  return current === undefined || BUMP_RANK[next] > BUMP_RANK[current] ? next : current;
}

function readSection(value: Record<string, unknown>, section: string): Record<string, string> {
  const entry = value[section];
  if (typeof entry !== "object" || entry === null || Array.isArray(entry)) {
    return {};
  }
  return entry as Record<string, string>;
}

function formatChange(
  path: string,
  dependency: string,
  previous: string | undefined,
  next: string | undefined,
): string {
  if (previous === undefined) {
    return `- \`${path}\`: added \`${dependency}\` at \`${String(next)}\``;
  }
  if (next === undefined) {
    return `- \`${path}\`: removed \`${dependency}\` (was \`${previous}\`)`;
  }
  return `- \`${path}\`: \`${dependency}\`: \`${previous}\` -> \`${next}\``;
}

/** Collects release notes for one publishable manifest. */
export function collectManifestRelease({
  path,
  base,
  head,
}: ManifestInput): ReleaseChange | undefined {
  if (head.private === true) {
    return undefined;
  }
  const name = head.name;
  if (typeof name !== "string") {
    return undefined;
  }

  let bump: BumpType | undefined;
  const summary: string[] = [];
  for (const section of DEPENDENCY_SECTIONS) {
    const previousDeps = readSection(base, section);
    const nextDeps = readSection(head, section);

    for (const [dependency, next] of Object.entries(nextDeps)) {
      const previous = previousDeps[dependency];
      if (previous === next) {
        continue;
      }
      summary.push(formatChange(path, dependency, previous, next));
      bump = maxBump(bump, classifyRangeChange(previous, next));
    }

    for (const [dependency, previous] of Object.entries(previousDeps)) {
      if (Object.hasOwn(nextDeps, dependency)) {
        continue;
      }
      summary.push(formatChange(path, dependency, previous, undefined));
      bump = maxBump(bump, "patch");
    }
  }

  return bump === undefined || summary.length === 0 ? undefined : { name, bump, summary };
}

/** Aggregates dependency changes by package name. */
export function collectReleaseChanges(inputs: readonly ManifestInput[]): ReleaseChange[] {
  const byName = new Map<string, { bump: BumpType; summary: string[] }>();

  for (const input of inputs) {
    const change = collectManifestRelease(input);
    if (change === undefined) {
      continue;
    }
    const existing = byName.get(change.name);
    if (existing === undefined) {
      byName.set(change.name, { bump: change.bump, summary: [...change.summary] });
    } else {
      existing.bump = maxBump(existing.bump, change.bump);
      existing.summary.push(...change.summary);
    }
  }

  return [...byName.entries()]
    .map(([name, { bump, summary }]) => ({
      name,
      bump,
      summary: [...new Set(summary)],
    }))
    .toSorted((a, b) => a.name.localeCompare(b.name));
}

/** Renders a Changesets fragment for dependency updates. */
export function renderChangeset(changes: readonly ReleaseChange[]): string {
  const summary = changes.flatMap((change) => change.summary);
  const lines = ["---"];
  for (const change of changes) {
    lines.push(`"${change.name}": ${change.bump}`);
  }
  lines.push("---", "", "Dependency updates:", "", ...summary, "");
  return lines.join("\n");
}

function git(args: readonly string[]): string {
  return execFileSync("git", args, { encoding: "utf8" });
}

function readJson(path: string): Record<string, unknown> {
  return JSON.parse(readFileSync(path, "utf8")) as Record<string, unknown>;
}

function changedManifests(base: string, head: string): string[] {
  return git([
    "diff",
    "--name-only",
    "--diff-filter=d",
    base,
    head,
    "--",
    "package.json",
    "packages/",
  ])
    .split("\n")
    .filter(
      (path) =>
        path === "package.json" || (path.startsWith("packages/") && path.endsWith("/package.json")),
    );
}

function baseManifest(base: string, path: string): Record<string, unknown> | undefined {
  try {
    return JSON.parse(git(["show", `${base}:${path}`])) as Record<string, unknown>;
  } catch {
    return undefined;
  }
}

function main(): void {
  const [base, headSha] = process.argv.slice(2);
  if (base === undefined || headSha === undefined) {
    throw new Error("Usage: generate-release-changeset <base> <head-sha>");
  }

  const inputs: ManifestInput[] = [];
  for (const path of changedManifests(base, "HEAD")) {
    if (!existsSync(path)) {
      continue;
    }
    const baseValue = baseManifest(base, path) ?? {};
    inputs.push({ path, base: baseValue, head: readJson(path) });
  }

  const changes = collectReleaseChanges(inputs);
  if (changes.length === 0) {
    console.log("No publishable dependency changes since the last version commit.");
    return;
  }

  const fragment = join(".changeset", `renovate-deps-${headSha.slice(0, 12)}.md`);
  writeFileSync(fragment, renderChangeset(changes));
  console.log(`Created ${fragment} for ${changes.map((change) => change.name).join(", ")}`);
}

if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}

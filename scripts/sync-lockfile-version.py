#!/usr/bin/env python3
"""Sync workspace package versions from package.json into bun.lock.

Changesets updates package.json versions but not bun.lock. bun's install
commands do not reconcile workspace version records, so this script patches
the workspace "version" lines directly, leaving everything else untouched.

Pass --check to verify the lockfile is in sync without modifying it.
"""

import argparse
import glob
import json
import os
import re
import sys
from typing import Any


def find_repo_root(start: str) -> str:
    current = os.path.abspath(start)
    while True:
        if os.path.isfile(os.path.join(current, "bun.lock")) and os.path.isfile(
            os.path.join(current, "package.json")
        ):
            return current
        parent = os.path.dirname(current)
        if parent == current:
            raise SystemExit(
                "error: could not find repo root (bun.lock + package.json) from "
                + start
            )
        current = parent


ROOT: str = os.environ.get("ROOT") or find_repo_root(
    os.path.dirname(os.path.abspath(__file__))
)


def read_json(path: str) -> Any:
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def discover_package_dirs() -> list[str]:
    """Expand the workspace globs from the root package.json.

    Supports "*" (direct children), "**" (recursive), literal paths, and
    "!"-prefixed negation patterns, matching bun/npm workspace semantics.
    Only directories containing a package.json are returned.
    """
    manifest = read_json(os.path.join(ROOT, "package.json"))
    include: list[str] = []
    exclude: list[str] = []
    for workspace in manifest.get("workspaces") or []:
        if workspace.startswith("!"):
            exclude.append(workspace[1:])
        else:
            include.append(workspace)

    dirs: list[str] = []
    for pattern in include:
        if glob.has_magic(pattern):
            for path in glob.glob(os.path.join(ROOT, pattern), recursive=True):
                if os.path.isfile(os.path.join(path, "package.json")):
                    dirs.append(path)
        elif os.path.isfile(os.path.join(ROOT, pattern, "package.json")):
            dirs.append(os.path.join(ROOT, pattern))

    if exclude:
        excluded: set[str] = set()
        for pattern in exclude:
            if glob.has_magic(pattern):
                excluded.update(glob.glob(os.path.join(ROOT, pattern), recursive=True))
            else:
                excluded.add(os.path.join(ROOT, pattern))
        dirs = [directory for directory in dirs if directory not in excluded]

    return list(dict.fromkeys(dirs))


def collect_versions() -> dict[str, str]:
    versions: dict[str, str] = {}
    for directory in discover_package_dirs():
        pkg = read_json(os.path.join(directory, "package.json"))
        version = pkg.get("version")
        if version:
            rel = os.path.relpath(directory, ROOT).replace(os.sep, "/")
            versions[rel] = version
    return versions


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Sync workspace package versions from package.json into bun.lock."
    )
    parser.add_argument(
        "--check",
        action="store_true",
        help="verify the lockfile is in sync without modifying it",
    )
    args = parser.parse_args()
    check_only = args.check

    versions = collect_versions()
    if not versions:
        return

    lock_path = os.path.join(ROOT, "bun.lock")
    with open(lock_path, encoding="utf-8") as f:
        lines: list[str] = f.read().split("\n")

    in_workspaces = False
    current_path: str | None = None
    pending_version: str | None = None
    changed = False
    applied: set[str] = set()

    for i, line in enumerate(lines):
        if not in_workspaces:
            if re.match(r'^ {2}"workspaces": \{$', line):
                in_workspaces = True
            continue

        block_open = re.match(r'^ {4}"([^"]+)": \{$', line)
        if block_open:
            current_path = block_open.group(1)
            pending_version = versions.get(current_path)
            continue

        if re.match(r"^ {4}\},$", line):
            current_path = None
            pending_version = None
            continue

        if re.match(r"^ {2}\},$", line):
            in_workspaces = False
            continue

        if pending_version is not None and re.match(
            r'^ {6}"version": "[^"]*",?$', line
        ):
            assert current_path is not None
            version: str = pending_version
            applied.add(current_path)
            new_line = re.sub(
                r'("version": ")[^"]*(",?)$',
                lambda m: m.group(1) + version + m.group(2),
                line,
            )
            if new_line != line:
                lines[i] = new_line
                changed = True
            pending_version = None

    missing = set(versions) - applied
    if missing:
        print(
            "error: could not find a version line in bun.lock for: "
            + ", ".join(sorted(missing)),
            file=sys.stderr,
        )

    if check_only:
        if changed or missing:
            print("bun.lock is out of sync with package.json")
            raise SystemExit(1)
        print("bun.lock is in sync")
        return

    if changed:
        with open(lock_path, "w", encoding="utf-8") as f:
            f.write("\n".join(lines))
        if missing:
            print("bun.lock: partially synced (see errors above)", file=sys.stderr)
        else:
            print("bun.lock: synced workspace versions")

    if missing:
        raise SystemExit(1)


if __name__ == "__main__":
    main()

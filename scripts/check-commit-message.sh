#!/usr/bin/env bash
# Validate a commit message or pull request title against the project's
# Conventional Commits format. Exits non-zero with a helpful message on failure.
#
# Usage:
#   scripts/check-commit-message.sh "feat(qui): add button variant"
#   scripts/check-commit-message.sh "$(cat .git/COMMIT_EDITMSG)"

set -euo pipefail

message="${1:-}"

# Ignore comment lines and leading blank lines, then validate the subject.
subject="$(printf '%s\n' "$message" | grep -v '^#' | sed '/^[[:space:]]*$/d' | head -n 1 || true)"

pattern='^(build|chore|ci|docs|feat|fix|perf|refactor|revert|style|test)(\([a-z0-9][a-z0-9._/-]*\))?!?: .+$'

if [[ -z "$subject" || ! "$subject" =~ $pattern ]]; then
  cat >&2 <<'EOF'
Invalid commit message. Use Conventional Commits:

  <type>(<optional scope>): <description>

Allowed types: build, chore, ci, docs, feat, fix, perf, refactor, revert, style, test

Examples:
  feat(qui): add button variant
  fix: prevent duplicate registration
  chore(deps): update dependency oxlint to v1.89.0
  refactor(unplugin)!: drop the legacy entry point

Write the description in the imperative mood and keep it on one line.
EOF
  if [[ -n "$subject" ]]; then
    printf '\nReceived: %s\n' "$subject" >&2
  fi
  exit 1
fi

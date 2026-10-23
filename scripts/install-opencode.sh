#!/usr/bin/env bash
# Install a pinned, integrity-verified OpenCode CLI binary.
#
# The version, npm integrity, and package name come from
# scripts/tools/opencode.env, so Renovate can bump them without touching this
# script or the CI workflow.
set -euo pipefail

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
env_file="$script_dir/tools/opencode.env"
# shellcheck source=lib/download.sh
. "$script_dir/lib/download.sh"
# shellcheck source=lib/env.sh
. "$script_dir/lib/env.sh"

env_file_validate "$env_file"
env_file_require "$env_file" OPENCODE_VERSION OPENCODE_INTEGRITY OPENCODE_PACKAGE

OPENCODE_VERSION="$(env_file_get "$env_file" OPENCODE_VERSION)"
OPENCODE_INTEGRITY="$(env_file_get "$env_file" OPENCODE_INTEGRITY)"
OPENCODE_PACKAGE="$(env_file_get "$env_file" OPENCODE_PACKAGE)"

dest_dir="/usr/local/bin"

usage() {
  cat <<'EOF'
Usage: install-opencode.sh [--dest DIR]

Installs the pinned OpenCode CLI into DIR (default: /usr/local/bin).
EOF
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --dest)
      [ "$#" -ge 2 ] || { echo "install-opencode.sh: --dest requires a value" >&2; exit 2; }
      dest_dir="$2"
      shift 2
      ;;
    --dest=*)
      dest_dir="${1#*=}"
      shift
      ;;
    -h | --help)
      usage
      exit 0
      ;;
    *)
      echo "install-opencode.sh: unknown argument: $1" >&2
      usage >&2
      exit 2
      ;;
  esac
done

tmp_dir="$(mktemp -d)"
trap 'rm -rf "$tmp_dir"' EXIT

archive="$tmp_dir/opencode.tgz"
package_base="${OPENCODE_PACKAGE##*/}"
url="https://registry.npmjs.org/${OPENCODE_PACKAGE}/-/${package_base}-${OPENCODE_VERSION}.tgz"

download_and_verify "$url" "$OPENCODE_INTEGRITY" "$archive"

mkdir -p "$dest_dir"
tar -xzf "$archive" -O package/bin/opencode | install -m 755 /dev/stdin "${dest_dir}/opencode"

actual="$("${dest_dir}/opencode" --version | head -n1)"
actual="${actual#opencode v}"
actual="${actual#v}"
actual="${actual%%+*}"
if [ "$actual" != "$OPENCODE_VERSION" ]; then
  echo "install-opencode.sh: version mismatch: got '$actual', expected '$OPENCODE_VERSION'" >&2
  exit 1
fi

echo "opencode ${actual} installed to ${dest_dir}/opencode"

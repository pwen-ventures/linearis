#!/usr/bin/env bash
# Install `linearis` globally from this fork by cloning the repo, packing a
# tarball, and installing it with `npm install -g <tarball>`.
#
# This script exists because `npm install -g github:pwen-ventures/linearis`
# sometimes produces an empty install on macOS due to an npm git-dependency
# caching bug. Installing from a locally-packed tarball sidesteps that path.
#
# Usage:
#   curl -sSL https://raw.githubusercontent.com/pwen-ventures/linearis/main/scripts/install.sh | bash
#   curl -sSL https://raw.githubusercontent.com/pwen-ventures/linearis/main/scripts/install.sh | bash -s -- <ref>

set -euo pipefail

REPO="git@github.com:pwen-ventures/linearis.git"
REF="${1:-main}"

TMPD="$(mktemp -d)"
trap 'rm -rf "$TMPD"' EXIT

echo "==> Cloning $REPO (ref: $REF) into $TMPD"
git clone --depth=1 --branch "$REF" "$REPO" "$TMPD/linearis" --quiet

cd "$TMPD/linearis"

echo "==> Packing tarball"
npm pack --silent >/dev/null

TARBALL="$(ls "$TMPD/linearis/"linearis-*.tgz | head -n1)"
if [[ -z "$TARBALL" ]]; then
  echo "error: npm pack did not produce a tarball" >&2
  exit 1
fi

echo "==> Installing globally from $TARBALL"
npm install -g "$TARBALL"

echo "==> Done"
command -v linearis >/dev/null && linearis --version

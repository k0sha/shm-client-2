#!/bin/bash
set -e

VERSION=$1

if [ -z "$VERSION" ]; then
  echo "Usage: $0 <version>"
  echo "Example: $0 2.2.4"
  exit 1
fi

if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "Error: working tree has uncommitted changes, commit or stash them first"
  exit 1
fi

npm version "$VERSION" -m "chore: bump version to %s"
git push --follow-tags

echo "Released $VERSION"

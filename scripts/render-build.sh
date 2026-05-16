#!/usr/bin/env bash
set -euo pipefail

CACHE_ROOT="${RENDER_CACHE_DIR:-/opt/render/cache}"
NEXT_CACHE_DIR="$CACHE_ROOT/next-cache"
NPM_CACHE_DIR="$CACHE_ROOT/npm-cache"

mkdir -p "$NEXT_CACHE_DIR" "$NPM_CACHE_DIR" .next

if [ -d "$NEXT_CACHE_DIR/cache" ]; then
  echo "Restoring Next.js build cache..."
  rm -rf .next/cache
  cp -R "$NEXT_CACHE_DIR/cache" .next/cache
fi

echo "Installing dependencies with npm cache..."
npm install --cache "$NPM_CACHE_DIR" --prefer-offline

echo "Building Next.js app..."
npm run build

if [ -d .next/cache ]; then
  echo "Saving Next.js build cache..."
  rm -rf "$NEXT_CACHE_DIR/cache"
  mkdir -p "$NEXT_CACHE_DIR"
  cp -R .next/cache "$NEXT_CACHE_DIR/cache"
fi

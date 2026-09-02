#!/bin/bash
set -e

cd apps/web

# Find the actual vite.js entry point (not the shell shim)
VITE_JS=""

# Try multiple strategies to find vite
VITE_JS=$(find ../../node_modules -name "vite.js" -path "*/vite/bin/vite.js" 2>/dev/null | head -1)

if [ -z "$VITE_JS" ]; then
  echo "ERROR: Could not find vite.js entry point"
  echo "Listing node_modules:"
  ls ../../node_modules/ 2>/dev/null | head -20
  echo "Listing .bin:"
  ls ../../node_modules/.bin/ 2>/dev/null | head -20
  exit 1
fi

echo "Using vite: $VITE_JS"
exec node "$VITE_JS" build

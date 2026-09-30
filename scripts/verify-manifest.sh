#!/bin/bash
set -euo pipefail

echo "Verifying manifests..."

shopt -s nullglob
manifest_dirs=(.output/*/manifest.json)

if [ ${#manifest_dirs[@]} -eq 0 ]; then
  echo "No manifest files found in .output"
  exit 1
fi

for manifest in "${manifest_dirs[@]}"; do
  dir="$(dirname "$manifest")"
  BROWSER_DIR="$(basename "$dir")"
  echo "  Checking $BROWSER_DIR..."

  if echo "$BROWSER_DIR" | grep -q "firefox"; then
    jq -e '.browser_specific_settings.gecko.id' "$manifest" > /dev/null && echo "    ✅ gecko.id present" || { echo "    ❌ gecko.id missing"; exit 1; }
  fi

  jq -e '.manifest_version == 3' "$manifest" > /dev/null && echo "    ✅ MV3" || { echo "    ❌ Not MV3"; exit 1; }
done

echo "All manifests verified successfully."

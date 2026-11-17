#!/usr/bin/env bash
# Copies the Pricemind chart renderer from a checkout of the Pricemind MCP
# server into the price-intelligence skill. The server's ui/chart.html is the
# single source (it is also the MCP App ui://pricemind/chart); never edit the
# copy here.
#
# Usage: scripts/sync-chart.sh /path/to/mcp-server-checkout [--check]
#   --check  exit 1 when the copy differs from the source instead of copying.
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "usage: $0 /path/to/mcp-server-checkout [--check]" >&2
  exit 2
fi

source_file="$1/internal/mcpserver/ui/chart.html"
repo_root="$(cd "$(dirname "$0")/.." && pwd)"
target_file="$repo_root/skills/price-intelligence/assets/chart.html"

if [[ ! -f "$source_file" ]]; then
  echo "not found: $source_file" >&2
  exit 2
fi

if [[ "${2:-}" == "--check" ]]; then
  if cmp -s "$source_file" "$target_file"; then
    echo "chart.html is in sync"
    exit 0
  fi
  echo "chart.html differs from $source_file; run scripts/sync-chart.sh $1" >&2
  exit 1
fi

cp "$source_file" "$target_file"
size=$(wc -c < "$target_file" | tr -d ' ')
echo "copied chart.html ($size bytes) from $source_file"

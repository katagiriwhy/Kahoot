#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
if [[ -f "$ROOT/.env" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$ROOT/.env"
  set +a
fi
export PUBLIC_BACKEND_ORIGIN="${PUBLIC_BACKEND_ORIGIN:-http://localhost:8080}"
python3 <<'PY' >"$ROOT/config/public-host.js"
import json, os
origin = os.environ.get("PUBLIC_BACKEND_ORIGIN", "http://localhost:8080")
print(f"window.__KAHOOT_PUBLIC_BACKEND__ = {json.dumps(origin)};")
PY

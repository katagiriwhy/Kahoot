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
export PUBLIC_API_PATH_PREFIX="${PUBLIC_API_PATH_PREFIX:-}"
export PUBLIC_SAME_ORIGIN_NO_API_PREFIX="${PUBLIC_SAME_ORIGIN_NO_API_PREFIX:-}"
python3 <<'PY' >"$ROOT/config/public-host.js"
import json, os
origin = os.environ.get("PUBLIC_BACKEND_ORIGIN", "http://localhost:8080")
prefix = os.environ.get("PUBLIC_API_PATH_PREFIX", "").strip()
no_infer = os.environ.get("PUBLIC_SAME_ORIGIN_NO_API_PREFIX", "").strip().lower() in ("1", "true", "yes")
print(f"window.__KAHOOT_PUBLIC_BACKEND__ = {json.dumps(origin)};")
print(f"window.__KAHOOT_API_PATH_PREFIX__ = {json.dumps(prefix)};")
print(f"window.__KAHOOT_SAME_ORIGIN_NO_API_PREFIX__ = {json.dumps(no_infer)};")
PY

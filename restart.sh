#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")"
./scripts/sync-public-host-from-env.sh

docker compose down

docker compose build

docker compose up -d

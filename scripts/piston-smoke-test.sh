#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${LIBRECHAT_BASE_URL:-}" ]]; then
  echo "LIBRECHAT_BASE_URL is not set (e.g., http://localhost:3080)" >&2
  exit 1
fi

if [[ -z "${LIBRECHAT_COOKIE:-}" ]]; then
  echo "LIBRECHAT_COOKIE is not set (e.g., 'connect.sid=...')" >&2
  exit 1
fi

echo "Checking runtimes..."
curl -s -H "Cookie: ${LIBRECHAT_COOKIE}" "${LIBRECHAT_BASE_URL}/api/piston/runtimes" | jq .

echo "Executing sample code..."
curl -s \
  -H "Cookie: ${LIBRECHAT_COOKIE}" \
  -H "Content-Type: application/json" \
  -d '{"language":"python","version":"*","code":"print(2+2)","stdin":""}' \
  "${LIBRECHAT_BASE_URL}/api/piston/execute" | jq .

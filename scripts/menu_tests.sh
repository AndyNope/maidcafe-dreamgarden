#!/usr/bin/env bash
# Simple API smoke tests for menu/category endpoints.
# Usage: ADMIN_TOKEN=yourtoken ./scripts/menu_tests.sh

set -euo pipefail

BASE=${API_URL:-http://localhost:8080}
AUTH_HEADER="-H Authorization: Bearer ${ADMIN_TOKEN:-}"

if [ -z "${ADMIN_TOKEN:-}" ]; then
  echo "Please set ADMIN_TOKEN environment variable. Example:" >&2
  echo "  ADMIN_TOKEN=xxx $0" >&2
  exit 2
fi

echo "1) Create test category"
CREATED=$(curl -s $AUTH_HEADER -H "Content-Type: application/json" -X POST "$BASE/api/menu/categories" -d '{"name":"CI Test Cat","name_jp":"","icon":"Tag","sort_order":9999}')
echo "$CREATED" | jq .
CAT_ID=$(echo "$CREATED" | jq -r .id)

echo "2) Set default category to $CAT_ID"
curl -s $AUTH_HEADER -H "Content-Type: application/json" -X PUT "$BASE/api/admin/settings/menu/default_category" -d "{\"id\": $CAT_ID}" | jq .

echo "3) Verify default category"
curl -s $AUTH_HEADER "$BASE/api/admin/settings/menu/default_category" | jq .

echo "4) Create a menu item in that category"
ITEM=$(curl -s $AUTH_HEADER -H "Content-Type: application/json" -X POST "$BASE/api/menu" -d "{\"category_id\": $CAT_ID, \"name\": \"CI Item\", \"price\": 1.50}")
echo "$ITEM" | jq .
ITEM_ID=$(echo "$ITEM" | jq -r .id)

echo "5) Delete category $CAT_ID (items should be reassigned)"
curl -s $AUTH_HEADER -X DELETE "$BASE/api/menu/categories/$CAT_ID" | jq .

echo "6) Check item $ITEM_ID category_id"
curl -s $AUTH_HEADER "$BASE/api/menu" | jq '.[] | .items[] | select(.id=='
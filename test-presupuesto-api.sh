#!/bin/bash

# ============================================================================
# TEST Script: Budget API Endpoints
# ============================================================================
# Purpose: Test all presupuesto API endpoints
# Usage: chmod +x test-presupuesto-api.sh && ./test-presupuesto-api.sh
# ============================================================================

BASE_URL="http://localhost:3000"
API_BASE="${BASE_URL}/api"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo ""
echo "========================================"
echo "Testing Budget API Endpoints"
echo "========================================"
echo ""

# ============================================================================
# Prerequisites
# ============================================================================
echo -e "${YELLOW}Prerequisites Check:${NC}"
echo "  - Server running on ${BASE_URL}"
echo "  - Valid session/auth token"
echo ""
echo -e "${YELLOW}Note:${NC} You need to manually set AUTH_TOKEN and SOBRE_ID below"
echo ""

# TODO: Replace with actual auth token and sobre_id from your session
AUTH_TOKEN="your-session-token-here"
SOBRE_ID="your-sobre-id-here"

if [ "$AUTH_TOKEN" = "your-session-token-here" ] || [ "$SOBRE_ID" = "your-sobre-id-here" ]; then
  echo -e "${RED}❌ ERROR: Please update AUTH_TOKEN and SOBRE_ID in this script${NC}"
  echo ""
  echo "To get these values:"
  echo "  1. Login to your app"
  echo "  2. Open browser DevTools → Application → Cookies"
  echo "  3. Copy the session token"
  echo "  4. Get a sobre_id from your database or API"
  echo ""
  exit 1
fi

HEADERS="Authorization: Bearer ${AUTH_TOKEN}"

echo -e "${GREEN}✓${NC} Configuration OK"
echo ""

# ============================================================================
# TEST 1: GET presupuesto (initial state)
# ============================================================================
echo "----------------------------------------"
echo "TEST 1: GET /api/sobres/${SOBRE_ID}/presupuesto"
echo "----------------------------------------"

RESPONSE=$(curl -s -X GET \
  "${API_BASE}/sobres/${SOBRE_ID}/presupuesto" \
  -H "${HEADERS}")

echo "Response:"
echo "${RESPONSE}" | jq '.'

SUCCESS=$(echo "${RESPONSE}" | jq -r '.success')
if [ "$SUCCESS" = "true" ]; then
  echo -e "${GREEN}✅ PASS${NC}"
else
  echo -e "${RED}❌ FAIL${NC}"
fi
echo ""

# ============================================================================
# TEST 2: PUT presupuesto - Enable with monto
# ============================================================================
echo "----------------------------------------"
echo "TEST 2: PUT /api/sobres/${SOBRE_ID}/presupuesto (enable)"
echo "----------------------------------------"

RESPONSE=$(curl -s -X PUT \
  "${API_BASE}/sobres/${SOBRE_ID}/presupuesto" \
  -H "${HEADERS}" \
  -H "Content-Type: application/json" \
  -d '{
    "enabled": true,
    "monto_global": 500000
  }')

echo "Response:"
echo "${RESPONSE}" | jq '.'

SUCCESS=$(echo "${RESPONSE}" | jq -r '.success')
ENABLED=$(echo "${RESPONSE}" | jq -r '.data.presupuesto_enabled')
MONTO=$(echo "${RESPONSE}" | jq -r '.data.monto_global')

if [ "$SUCCESS" = "true" ] && [ "$ENABLED" = "true" ] && [ "$MONTO" = "500000" ]; then
  echo -e "${GREEN}✅ PASS${NC}"
  PRESUPUESTO_ID=$(echo "${RESPONSE}" | jq -r '.data.id')
else
  echo -e "${RED}❌ FAIL${NC}"
fi
echo ""

# ============================================================================
# TEST 3: POST cuota - Add categoria quota
# ============================================================================
echo "----------------------------------------"
echo "TEST 3: POST /api/sobres/${SOBRE_ID}/presupuesto/cuotas"
echo "----------------------------------------"

# TODO: Replace with actual categoria_id from your database
CATEGORIA_ID="your-categoria-id-here"

if [ "$CATEGORIA_ID" = "your-categoria-id-here" ]; then
  echo -e "${YELLOW}⚠ SKIP: Update CATEGORIA_ID to test this endpoint${NC}"
else
  RESPONSE=$(curl -s -X POST \
    "${API_BASE}/sobres/${SOBRE_ID}/presupuesto/cuotas" \
    -H "${HEADERS}" \
    -H "Content-Type: application/json" \
    -d "{
      \"categoria_id\": \"${CATEGORIA_ID}\",
      \"monto_cuota\": 200000
    }")

  echo "Response:"
  echo "${RESPONSE}" | jq '.'

  SUCCESS=$(echo "${RESPONSE}" | jq -r '.success')
  if [ "$SUCCESS" = "true" ]; then
    echo -e "${GREEN}✅ PASS${NC}"
  else
    echo -e "${RED}❌ FAIL${NC}"
  fi
fi
echo ""

# ============================================================================
# TEST 4: GET presupuesto completo (with cuotas)
# ============================================================================
echo "----------------------------------------"
echo "TEST 4: GET /api/sobres/${SOBRE_ID}/presupuesto (with cuotas)"
echo "----------------------------------------"

RESPONSE=$(curl -s -X GET \
  "${API_BASE}/sobres/${SOBRE_ID}/presupuesto" \
  -H "${HEADERS}")

echo "Response:"
echo "${RESPONSE}" | jq '.'

SUCCESS=$(echo "${RESPONSE}" | jq -r '.success')
CUOTAS_COUNT=$(echo "${RESPONSE}" | jq -r '.data.cuotas | length')

if [ "$SUCCESS" = "true" ]; then
  echo -e "${GREEN}✅ PASS${NC}"
  echo "  Cuotas count: ${CUOTAS_COUNT}"
else
  echo -e "${RED}❌ FAIL${NC}"
fi
echo ""

# ============================================================================
# TEST 5: GET sugerencia
# ============================================================================
echo "----------------------------------------"
echo "TEST 5: GET /api/sobres/${SOBRE_ID}/presupuesto/sugerencia"
echo "----------------------------------------"

RESPONSE=$(curl -s -X GET \
  "${API_BASE}/sobres/${SOBRE_ID}/presupuesto/sugerencia" \
  -H "${HEADERS}")

echo "Response:"
echo "${RESPONSE}" | jq '.'

SUCCESS=$(echo "${RESPONSE}" | jq -r '.success')
if [ "$SUCCESS" = "true" ]; then
  echo -e "${GREEN}✅ PASS${NC}"
  MONTO_SUGERIDO=$(echo "${RESPONSE}" | jq -r '.data.monto_global_sugerido // "N/A"')
  echo "  Monto sugerido: ${MONTO_SUGERIDO}"
else
  echo -e "${RED}❌ FAIL${NC}"
fi
echo ""

# ============================================================================
# TEST 6: GET stats
# ============================================================================
echo "----------------------------------------"
echo "TEST 6: GET /api/sobres/${SOBRE_ID}/presupuesto/stats"
echo "----------------------------------------"

RESPONSE=$(curl -s -X GET \
  "${API_BASE}/sobres/${SOBRE_ID}/presupuesto/stats" \
  -H "${HEADERS}")

echo "Response:"
echo "${RESPONSE}" | jq '.'

SUCCESS=$(echo "${RESPONSE}" | jq -r '.success')
if [ "$SUCCESS" = "true" ]; then
  echo -e "${GREEN}✅ PASS${NC}"
  TOTAL_AJUSTES=$(echo "${RESPONSE}" | jq -r '.data.total_ajustes')
  echo "  Total ajustes: ${TOTAL_AJUSTES}"
else
  echo -e "${RED}❌ FAIL${NC}"
fi
echo ""

# ============================================================================
# TEST 7: PUT presupuesto - Update monto_global
# ============================================================================
echo "----------------------------------------"
echo "TEST 7: PUT /api/sobres/${SOBRE_ID}/presupuesto (update monto)"
echo "----------------------------------------"

RESPONSE=$(curl -s -X PUT \
  "${API_BASE}/sobres/${SOBRE_ID}/presupuesto" \
  -H "${HEADERS}" \
  -H "Content-Type: application/json" \
  -d '{
    "monto_global": 600000
  }')

echo "Response:"
echo "${RESPONSE}" | jq '.'

SUCCESS=$(echo "${RESPONSE}" | jq -r '.success')
MONTO=$(echo "${RESPONSE}" | jq -r '.data.monto_global')

if [ "$SUCCESS" = "true" ] && [ "$MONTO" = "600000" ]; then
  echo -e "${GREEN}✅ PASS${NC}"
else
  echo -e "${RED}❌ FAIL${NC}"
fi
echo ""

# ============================================================================
# TEST 8: DELETE cuota
# ============================================================================
if [ "$CATEGORIA_ID" != "your-categoria-id-here" ]; then
  echo "----------------------------------------"
  echo "TEST 8: DELETE /api/sobres/${SOBRE_ID}/presupuesto/cuotas/${CATEGORIA_ID}"
  echo "----------------------------------------"

  RESPONSE=$(curl -s -X DELETE \
    "${API_BASE}/sobres/${SOBRE_ID}/presupuesto/cuotas/${CATEGORIA_ID}" \
    -H "${HEADERS}")

  echo "Response:"
  echo "${RESPONSE}" | jq '.'

  SUCCESS=$(echo "${RESPONSE}" | jq -r '.success')
  if [ "$SUCCESS" = "true" ]; then
    echo -e "${GREEN}✅ PASS${NC}"
  else
    echo -e "${RED}❌ FAIL${NC}"
  fi
  echo ""
fi

# ============================================================================
# TEST 9: PUT presupuesto - Disable
# ============================================================================
echo "----------------------------------------"
echo "TEST 9: PUT /api/sobres/${SOBRE_ID}/presupuesto (disable)"
echo "----------------------------------------"

RESPONSE=$(curl -s -X PUT \
  "${API_BASE}/sobres/${SOBRE_ID}/presupuesto" \
  -H "${HEADERS}" \
  -H "Content-Type: application/json" \
  -d '{
    "enabled": false
  }')

echo "Response:"
echo "${RESPONSE}" | jq '.'

SUCCESS=$(echo "${RESPONSE}" | jq -r '.success')
ENABLED=$(echo "${RESPONSE}" | jq -r '.data.presupuesto_enabled')

if [ "$SUCCESS" = "true" ] && [ "$ENABLED" = "false" ]; then
  echo -e "${GREEN}✅ PASS${NC}"
else
  echo -e "${RED}❌ FAIL${NC}"
fi
echo ""

# ============================================================================
# Summary
# ============================================================================
echo "========================================"
echo "Testing Complete"
echo "========================================"
echo ""
echo "Review results above for any failures."
echo ""

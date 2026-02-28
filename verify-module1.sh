#!/usr/bin/env bash
#
# verify-module1.sh — Verify Module 1 (Auth & Company Management) endpoints
#
# Usage:
#   chmod +x verify-module1.sh
#   ./verify-module1.sh
#
# Prerequisites:
#   - Backend running on http://localhost:5000 (npm run dev)
#   - MongoDB running and connected
#

BASE_URL="http://localhost:5000"
COOKIE_JAR="/tmp/clientproject_cookies.txt"
PASS=0
FAIL=0

cleanup() {
  rm -f "$COOKIE_JAR"
}
trap cleanup EXIT

green() { echo -e "\033[0;32m✓ $1\033[0m"; }
red()   { echo -e "\033[0;31m✗ $1\033[0m"; }

check() {
  local label="$1"
  local expected_code="$2"
  local actual_code="$3"
  local body="$4"

  if [ "$actual_code" = "$expected_code" ]; then
    green "$label (HTTP $actual_code)"
    PASS=$((PASS + 1))
  else
    red "$label — expected HTTP $expected_code, got HTTP $actual_code"
    echo "  Response: $body"
    FAIL=$((FAIL + 1))
  fi
}

echo ""
echo "============================================"
echo "  Module 1 — Local Verification Script"
echo "============================================"
echo ""

# Generate a unique email for this run
UNIQUE=$(date +%s)
TEST_EMAIL="testuser${UNIQUE}@example.com"
TEST_PASSWORD="SecurePass123"
TEST_NAME="Test User"
TEST_COMPANY="Test HVAC Co"

# ── 1. Health Check ──────────────────────────────────────────
echo "── Health Check ──"
RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/health")
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | sed '$d')
check "GET /api/health" "200" "$HTTP_CODE" "$BODY"
echo ""

# ── 2. Register ──────────────────────────────────────────────
echo "── Register ──"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -c "$COOKIE_JAR" \
  -d "{\"name\":\"$TEST_NAME\",\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\",\"companyName\":\"$TEST_COMPANY\"}")
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | sed '$d')
check "POST /api/auth/register" "201" "$HTTP_CODE" "$BODY"
echo "  → Registered as: $TEST_EMAIL"
echo ""

# ── 3. Get Me (authenticated) ────────────────────────────────
echo "── Get Current User ──"
RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/auth/me" \
  -b "$COOKIE_JAR")
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | sed '$d')
check "GET /api/auth/me (with cookie)" "200" "$HTTP_CODE" "$BODY"
echo ""

# ── 4. Logout ────────────────────────────────────────────────
echo "── Logout ──"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/auth/logout" \
  -b "$COOKIE_JAR" \
  -c "$COOKIE_JAR")
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | sed '$d')
check "POST /api/auth/logout" "200" "$HTTP_CODE" "$BODY"
echo ""

# ── 5. Get Me (after logout — should fail) ───────────────────
echo "── Get Current User (after logout, should fail) ──"
RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/auth/me")
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | sed '$d')
check "GET /api/auth/me (no cookie)" "401" "$HTTP_CODE" "$BODY"
echo ""

# ── 6. Login ─────────────────────────────────────────────────
echo "── Login ──"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -c "$COOKIE_JAR" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | sed '$d')
check "POST /api/auth/login" "200" "$HTTP_CODE" "$BODY"
echo ""

# ── 7. Get Me (after login) ──────────────────────────────────
echo "── Get Current User (after login) ──"
RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/auth/me" \
  -b "$COOKIE_JAR")
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | sed '$d')
check "GET /api/auth/me (after login)" "200" "$HTTP_CODE" "$BODY"
echo ""

# ── 8. Register duplicate email (should fail) ────────────────
echo "── Register Duplicate Email (should fail) ──"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"$TEST_NAME\",\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\",\"companyName\":\"$TEST_COMPANY\"}")
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | sed '$d')
check "POST /api/auth/register (duplicate)" "409" "$HTTP_CODE" "$BODY"
echo ""

# ── 9. Login with wrong password (should fail) ───────────────
echo "── Login with Wrong Password (should fail) ──"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"WrongPassword123\"}")
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | sed '$d')
check "POST /api/auth/login (wrong password)" "401" "$HTTP_CODE" "$BODY"
echo ""

# ── 10. Register with invalid data (should fail) ─────────────
echo "── Register with Invalid Data (should fail) ──"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"\",\"email\":\"not-an-email\",\"password\":\"short\"}")
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | sed '$d')
check "POST /api/auth/register (invalid data)" "400" "$HTTP_CODE" "$BODY"
echo ""

# ── Summary ──────────────────────────────────────────────────
echo "============================================"
echo "  Results: $PASS passed, $FAIL failed"
echo "============================================"

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi

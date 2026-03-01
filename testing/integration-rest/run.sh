#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3001}"
API_KEY="${API_KEY:-sigloop-dev-key}"
PASSED=0
FAILED=0
FAILURES=()

RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
BOLD='\033[1m'
RESET='\033[0m'

WALLET_ID=""
WALLET_ADDRESS=""
AGENT_ID=""
AGENT_SESSION_KEY=""
POLICY_ID=""
POLICY_ID_X402=""
POLICY_ID_SPENDING=""
PAYMENT_ID=""
SECOND_WALLET_ID=""
SECOND_AGENT_ID=""
THIRD_AGENT_ID=""

curl_api() {
  local method="$1"
  local path="$2"
  shift 2
  curl -s -w "\n%{http_code}" \
    -X "$method" \
    -H "Content-Type: application/json" \
    -H "X-API-KEY: $API_KEY" \
    "$BASE_URL$path" \
    "$@"
}

curl_no_auth() {
  local method="$1"
  local path="$2"
  shift 2
  curl -s -w "\n%{http_code}" \
    -X "$method" \
    -H "Content-Type: application/json" \
    "$BASE_URL$path" \
    "$@"
}

parse_response() {
  local raw="$1"
  BODY=$(echo "$raw" | sed '$d')
  HTTP_CODE=$(echo "$raw" | tail -1)
}

assert_status() {
  local expected="$1"
  if [[ "$HTTP_CODE" != "$expected" ]]; then
    echo -e "  ${RED}expected status $expected, got $HTTP_CODE${RESET}"
    echo -e "  ${RED}body: $BODY${RESET}"
    return 1
  fi
}

assert_json() {
  local field="$1"
  local expected="$2"
  local actual
  actual=$(echo "$BODY" | jq -r "$field" 2>/dev/null || echo "PARSE_ERROR")
  if [[ "$actual" != "$expected" ]]; then
    echo -e "  ${RED}$field: expected '$expected', got '$actual'${RESET}"
    return 1
  fi
}

assert_exists() {
  local field="$1"
  local actual
  actual=$(echo "$BODY" | jq -r "$field" 2>/dev/null || echo "PARSE_ERROR")
  if [[ "$actual" == "null" || -z "$actual" || "$actual" == "PARSE_ERROR" ]]; then
    echo -e "  ${RED}$field should exist, got '$actual'${RESET}"
    return 1
  fi
}

assert_type() {
  local field="$1"
  local expected="$2"
  local actual
  actual=$(echo "$BODY" | jq -r "$field | type" 2>/dev/null || echo "PARSE_ERROR")
  if [[ "$actual" != "$expected" ]]; then
    echo -e "  ${RED}$field type: expected '$expected', got '$actual'${RESET}"
    return 1
  fi
}

assert_gte() {
  local field="$1"
  local min="$2"
  local actual
  actual=$(echo "$BODY" | jq -r "$field" 2>/dev/null || echo "0")
  if (( $(echo "$actual < $min" | bc -l) )); then
    echo -e "  ${RED}$field: expected >= $min, got $actual${RESET}"
    return 1
  fi
}

run_test() {
  local name="$1"
  local fn="$2"
  printf "  %-62s" "$name"
  local tmpfile
  tmpfile=$(mktemp)
  if "$fn" > "$tmpfile" 2>&1; then
    echo -e "${GREEN}PASS${RESET}"
    PASSED=$((PASSED + 1))
  else
    echo -e "${RED}FAIL${RESET}"
    head -5 "$tmpfile" | sed 's/^/    /'
    FAILED=$((FAILED + 1))
    FAILURES+=("$name")
  fi
  rm -f "$tmpfile"
}

section() {
  echo ""
  echo -e "${BOLD}$1${RESET}"
}

reset_server() {
  local agents wallets policies
  agents=$(curl -s -H "X-API-KEY: $API_KEY" "$BASE_URL/api/agents" | jq -r '.agents[].id // empty' 2>/dev/null)
  for id in $agents; do
    curl -s -X DELETE -H "X-API-KEY: $API_KEY" "$BASE_URL/api/agents/$id" > /dev/null 2>&1
  done
  policies=$(curl -s -H "X-API-KEY: $API_KEY" "$BASE_URL/api/policies" | jq -r '.policies[].id // empty' 2>/dev/null)
  for id in $policies; do
    curl -s -X DELETE -H "X-API-KEY: $API_KEY" "$BASE_URL/api/policies/$id" > /dev/null 2>&1
  done
  wallets=$(curl -s -H "X-API-KEY: $API_KEY" "$BASE_URL/api/wallets" | jq -r '.wallets[].id // empty' 2>/dev/null)
  for id in $wallets; do
    curl -s -X DELETE -H "X-API-KEY: $API_KEY" "$BASE_URL/api/wallets/$id" > /dev/null 2>&1
  done
}

# ============================================================================
# HEALTH
# ============================================================================

test_health_ok() {
  parse_response "$(curl_no_auth GET /api/health)"
  assert_status 200
  assert_json '.status' 'ok'
  assert_exists '.version'
  assert_exists '.timestamp'
}

test_health_version() {
  parse_response "$(curl_no_auth GET /api/health)"
  assert_status 200
  assert_json '.version' '0.1.0'
}

# ============================================================================
# AUTH
# ============================================================================

test_auth_missing_key() {
  parse_response "$(curl_no_auth GET /api/wallets)"
  assert_status 401
}

test_auth_invalid_key() {
  local raw
  raw=$(curl -s -w "\n%{http_code}" -X GET \
    -H "Content-Type: application/json" \
    -H "X-API-KEY: wrong-key" \
    "$BASE_URL/api/wallets")
  parse_response "$raw"
  assert_status 403
}

test_auth_valid_key() {
  parse_response "$(curl_api GET /api/wallets)"
  assert_status 200
}

# ============================================================================
# WALLETS
# ============================================================================

test_wallet_create() {
  parse_response "$(curl_api POST /api/wallets -d '{"name":"test-wallet","chainId":8453}')"
  assert_status 201
  assert_json '.wallet.name' 'test-wallet'
  assert_json '.wallet.chainId' '8453'
  assert_exists '.wallet.id'
  assert_exists '.wallet.address'
  assert_exists '.wallet.createdAt'
  WALLET_ID=$(echo "$BODY" | jq -r '.wallet.id')
  WALLET_ADDRESS=$(echo "$BODY" | jq -r '.wallet.address')
}

test_wallet_create_default_chain() {
  parse_response "$(curl_api POST /api/wallets -d '{"name":"second-wallet"}')"
  assert_status 201
  assert_json '.wallet.name' 'second-wallet'
  assert_exists '.wallet.chainId'
  SECOND_WALLET_ID=$(echo "$BODY" | jq -r '.wallet.id')
}

test_wallet_create_missing_name() {
  parse_response "$(curl_api POST /api/wallets -d '{}')"
  assert_status 400
}

test_wallet_list() {
  parse_response "$(curl_api GET /api/wallets)"
  assert_status 200
  assert_type '.wallets' 'array'
  assert_gte '.total' 2
}

test_wallet_get() {
  parse_response "$(curl_api GET /api/wallets/$WALLET_ID)"
  assert_status 200
  assert_json '.wallet.id' "$WALLET_ID"
  assert_json '.wallet.name' 'test-wallet'
}

test_wallet_get_not_found() {
  parse_response "$(curl_api GET /api/wallets/00000000-0000-0000-0000-000000000000)"
  assert_status 404
}

test_wallet_sign_message() {
  parse_response "$(curl_api POST /api/wallets/$WALLET_ID/sign-message -d '{"message":"hello sigloop"}')"
  assert_status 200
  assert_exists '.signature'
}

test_wallet_sign_message_missing() {
  parse_response "$(curl_api POST /api/wallets/$WALLET_ID/sign-message -d '{}')"
  assert_status 400
}

test_wallet_delete_second() {
  parse_response "$(curl_api DELETE /api/wallets/$SECOND_WALLET_ID)"
  assert_status 200
  assert_json '.message' 'Wallet deleted'
}

test_wallet_delete_not_found() {
  parse_response "$(curl_api DELETE /api/wallets/00000000-0000-0000-0000-000000000000)"
  assert_status 404
}

# ============================================================================
# POLICIES
# ============================================================================

test_policy_create_agent() {
  parse_response "$(curl_api POST /api/policies -d '{
    "name":"agent-policy",
    "type":"agent",
    "config":{
      "allowedTargets":["0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"],
      "allowedSelectors":["0xa9059cbb"],
      "maxAmountPerTx":"1000000",
      "dailyLimit":"5000000",
      "weeklyLimit":"20000000",
      "validAfter":0,
      "validUntil":1999999999
    }
  }')"
  assert_status 201
  assert_json '.policy.name' 'agent-policy'
  assert_json '.policy.type' 'agent'
  assert_exists '.policy.id'
  assert_exists '.policy.config'
  assert_exists '.policy.createdAt'
  POLICY_ID=$(echo "$BODY" | jq -r '.policy.id')
}

test_policy_create_x402() {
  parse_response "$(curl_api POST /api/policies -d '{
    "name":"x402-policy",
    "type":"x402",
    "config":{
      "maxPerRequest":"1000000",
      "dailyBudget":"10000000",
      "totalBudget":"100000000",
      "allowedDomains":["api.openai.com","api.anthropic.com"]
    }
  }')"
  assert_status 201
  assert_json '.policy.name' 'x402-policy'
  assert_json '.policy.type' 'x402'
  POLICY_ID_X402=$(echo "$BODY" | jq -r '.policy.id')
}

test_policy_create_spending() {
  parse_response "$(curl_api POST /api/policies -d '{
    "name":"spending-policy",
    "type":"spending",
    "config":{
      "agent":"0x0000000000000000000000000000000000000001",
      "token":"0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
      "dailyLimit":"5000000",
      "weeklyLimit":"20000000"
    }
  }')"
  assert_status 201
  assert_json '.policy.name' 'spending-policy'
  assert_json '.policy.type' 'spending'
  POLICY_ID_SPENDING=$(echo "$BODY" | jq -r '.policy.id')
}

test_policy_create_missing_name() {
  parse_response "$(curl_api POST /api/policies -d '{"type":"agent","config":{"validUntil":9999}}')"
  assert_status 400
}

test_policy_create_missing_type() {
  parse_response "$(curl_api POST /api/policies -d '{"name":"no-type","config":{}}')"
  assert_status 400
}

test_policy_create_missing_config() {
  parse_response "$(curl_api POST /api/policies -d '{"name":"no-config","type":"agent"}')"
  assert_status 400
}

test_policy_create_invalid_type() {
  parse_response "$(curl_api POST /api/policies -d '{"name":"bad","type":"invalid","config":{}}')"
  assert_status 400
}

test_policy_create_x402_missing_fields() {
  parse_response "$(curl_api POST /api/policies -d '{"name":"bad-x402","type":"x402","config":{"maxPerRequest":"1"}}')"
  assert_status 400
}

test_policy_list() {
  parse_response "$(curl_api GET /api/policies)"
  assert_status 200
  assert_type '.policies' 'array'
  assert_gte '.total' 3
}

test_policy_get() {
  parse_response "$(curl_api GET /api/policies/$POLICY_ID)"
  assert_status 200
  assert_json '.policy.id' "$POLICY_ID"
  assert_json '.policy.name' 'agent-policy'
  assert_json '.policy.type' 'agent'
}

test_policy_get_not_found() {
  parse_response "$(curl_api GET /api/policies/00000000-0000-0000-0000-000000000000)"
  assert_status 404
}

test_policy_update() {
  parse_response "$(curl_api PUT /api/policies/$POLICY_ID -d '{"name":"updated-agent-policy"}')"
  assert_status 200
  assert_json '.policy.name' 'updated-agent-policy'
  assert_json '.policy.type' 'agent'
}

test_policy_update_not_found() {
  parse_response "$(curl_api PUT /api/policies/00000000-0000-0000-0000-000000000000 -d '{"name":"ghost"}')"
  assert_status 404
}

test_policy_encode() {
  parse_response "$(curl_api POST /api/policies/$POLICY_ID/encode)"
  assert_status 200
  assert_exists '.encoded'
}

test_policy_encode_x402() {
  parse_response "$(curl_api POST /api/policies/$POLICY_ID_X402/encode)"
  assert_status 200
  assert_exists '.encoded'
}

test_policy_compose() {
  local data
  data=$(jq -n --arg p "$POLICY_ID" '{policyIds:[$p]}')
  parse_response "$(curl_api POST /api/policies/compose -d "$data")"
  assert_status 201
  assert_exists '.policy.id'
  assert_json '.policy.type' 'agent'
}

test_policy_compose_empty() {
  parse_response "$(curl_api POST /api/policies/compose -d '{"policyIds":[]}')"
  assert_status 400
}

# ============================================================================
# AGENTS
# ============================================================================

test_agent_create() {
  parse_response "$(curl_api POST /api/agents/wallets/$WALLET_ID/agents -d '{"name":"trading-bot"}')"
  assert_status 201
  assert_json '.agent.name' 'trading-bot'
  assert_json '.agent.walletId' "$WALLET_ID"
  assert_json '.agent.status' 'active'
  assert_exists '.agent.id'
  assert_exists '.agent.address'
  assert_exists '.agent.expiresAt'
  assert_exists '.sessionKey'
  AGENT_ID=$(echo "$BODY" | jq -r '.agent.id')
  AGENT_SESSION_KEY=$(echo "$BODY" | jq -r '.sessionKey')
}

test_agent_create_with_policy() {
  local data
  data=$(jq -n --arg p "$POLICY_ID" '{name:"policy-bot", policyId:$p}')
  parse_response "$(curl_api POST /api/agents/wallets/$WALLET_ID/agents -d "$data")"
  assert_status 201
  assert_json '.agent.name' 'policy-bot'
  assert_json '.agent.policyId' "$POLICY_ID"
  SECOND_AGENT_ID=$(echo "$BODY" | jq -r '.agent.id')
}

test_agent_create_with_duration() {
  parse_response "$(curl_api POST /api/agents/wallets/$WALLET_ID/agents -d '{"name":"temp-bot","sessionDuration":3600}')"
  assert_status 201
  assert_json '.agent.name' 'temp-bot'
  assert_exists '.agent.expiresAt'
  THIRD_AGENT_ID=$(echo "$BODY" | jq -r '.agent.id')
}

test_agent_create_missing_name() {
  parse_response "$(curl_api POST /api/agents/wallets/$WALLET_ID/agents -d '{}')"
  assert_status 400
}

test_agent_create_invalid_wallet() {
  parse_response "$(curl_api POST /api/agents/wallets/00000000-0000-0000-0000-000000000000/agents -d '{"name":"orphan"}')"
  assert_status 404
}

test_agent_create_invalid_policy() {
  parse_response "$(curl_api POST /api/agents/wallets/$WALLET_ID/agents -d '{"name":"bad-pol","policyId":"00000000-0000-0000-0000-000000000000"}')"
  assert_status 404
}

test_agent_list() {
  parse_response "$(curl_api GET /api/agents)"
  assert_status 200
  assert_type '.agents' 'array'
  assert_gte '.total' 3
}

test_agent_list_by_wallet() {
  parse_response "$(curl_api GET /api/agents?walletId=$WALLET_ID)"
  assert_status 200
  assert_type '.agents' 'array'
  assert_gte '.total' 3
}

test_agent_get() {
  parse_response "$(curl_api GET /api/agents/$AGENT_ID)"
  assert_status 200
  assert_json '.agent.id' "$AGENT_ID"
  assert_json '.agent.name' 'trading-bot'
  assert_json '.agent.status' 'active'
}

test_agent_get_not_found() {
  parse_response "$(curl_api GET /api/agents/00000000-0000-0000-0000-000000000000)"
  assert_status 404
}

test_agent_get_session() {
  parse_response "$(curl_api GET /api/agents/$AGENT_ID/session)"
  assert_status 200
  assert_exists '.session.expiresAt'
  assert_exists '.session.remainingSeconds'
}

test_agent_get_policy() {
  parse_response "$(curl_api GET /api/agents/$SECOND_AGENT_ID/policy)"
  assert_status 200
  assert_exists '.policy'
}

test_agent_get_policy_none() {
  parse_response "$(curl_api GET /api/agents/$AGENT_ID/policy)"
  assert_status 200
  assert_json '.policy' 'null'
}

test_agent_revoke() {
  parse_response "$(curl_api POST /api/agents/$SECOND_AGENT_ID/revoke)"
  assert_status 200
  assert_json '.agent.status' 'revoked'
  assert_exists '.agent.revokedAt'
}

test_agent_revoke_already() {
  parse_response "$(curl_api POST /api/agents/$SECOND_AGENT_ID/revoke)"
  assert_status 409
}

test_agent_delete() {
  parse_response "$(curl_api DELETE /api/agents/$SECOND_AGENT_ID)"
  assert_status 200
  assert_json '.message' 'Agent deleted'
}

test_agent_delete_not_found() {
  parse_response "$(curl_api DELETE /api/agents/00000000-0000-0000-0000-000000000000)"
  assert_status 404
}

# ============================================================================
# PAYMENTS
# ============================================================================

test_payment_create() {
  local data
  data=$(jq -n --arg a "$AGENT_ID" --arg w "$WALLET_ID" \
    '{agentId:$a, walletId:$w, domain:"api.openai.com", amount:"25", currency:"USDC", metadata:{model:"gpt-4"}}')
  parse_response "$(curl_api POST /api/payments -d "$data")"
  assert_status 201
  assert_json '.payment.agentId' "$AGENT_ID"
  assert_json '.payment.walletId' "$WALLET_ID"
  assert_json '.payment.domain' 'api.openai.com'
  assert_json '.payment.currency' 'USDC'
  assert_json '.payment.status' 'completed'
  assert_exists '.payment.id'
  assert_exists '.payment.asset'
  PAYMENT_ID=$(echo "$BODY" | jq -r '.payment.id')
}

test_payment_create_default_currency() {
  local data
  data=$(jq -n --arg a "$AGENT_ID" --arg w "$WALLET_ID" \
    '{agentId:$a, walletId:$w, domain:"api.anthropic.com", amount:"10"}')
  parse_response "$(curl_api POST /api/payments -d "$data")"
  assert_status 201
  assert_json '.payment.currency' 'USDC'
  assert_json '.payment.domain' 'api.anthropic.com'
}

test_payment_create_third() {
  local data
  data=$(jq -n --arg a "$AGENT_ID" --arg w "$WALLET_ID" \
    '{agentId:$a, walletId:$w, domain:"api.openai.com", amount:"5"}')
  parse_response "$(curl_api POST /api/payments -d "$data")"
  assert_status 201
}

test_payment_create_missing_agent() {
  parse_response "$(curl_api POST /api/payments -d '{"walletId":"x","domain":"x","amount":"1"}')"
  assert_status 400
}

test_payment_create_missing_wallet() {
  parse_response "$(curl_api POST /api/payments -d '{"agentId":"x","domain":"x","amount":"1"}')"
  assert_status 400
}

test_payment_create_missing_domain() {
  parse_response "$(curl_api POST /api/payments -d '{"agentId":"x","walletId":"x","amount":"1"}')"
  assert_status 400
}

test_payment_create_missing_amount() {
  parse_response "$(curl_api POST /api/payments -d '{"agentId":"x","walletId":"x","domain":"x"}')"
  assert_status 400
}

test_payment_create_agent_not_found() {
  local data
  data=$(jq -n --arg w "$WALLET_ID" \
    '{agentId:"00000000-0000-0000-0000-000000000000", walletId:$w, domain:"x.com", amount:"1"}')
  parse_response "$(curl_api POST /api/payments -d "$data")"
  assert_status 404
}

test_payment_list() {
  parse_response "$(curl_api GET /api/payments)"
  assert_status 200
  assert_type '.payments' 'array'
  assert_gte '.total' 3
}

test_payment_list_by_agent() {
  parse_response "$(curl_api GET /api/payments?agentId=$AGENT_ID)"
  assert_status 200
  assert_gte '.total' 3
}

test_payment_list_by_wallet() {
  parse_response "$(curl_api GET /api/payments?walletId=$WALLET_ID)"
  assert_status 200
  assert_gte '.total' 3
}

test_payment_list_by_domain() {
  parse_response "$(curl_api GET /api/payments?domain=api.openai.com)"
  assert_status 200
  assert_gte '.total' 2
}

test_payment_stats() {
  parse_response "$(curl_api GET /api/payments/stats)"
  assert_status 200
  assert_exists '.stats.totalSpent'
  assert_gte '.stats.totalTransactions' 3
  assert_type '.stats.byAgent' 'object'
  assert_type '.stats.byDomain' 'object'
  assert_type '.stats.byPeriod' 'array'
}

test_payment_budget_get() {
  parse_response "$(curl_api GET /api/payments/budgets/$WALLET_ID)"
  assert_status 200
  assert_json '.budget.walletId' "$WALLET_ID"
  assert_exists '.budget.totalSpent'
  assert_exists '.budget.dailySpent'
  assert_exists '.budget.remaining'
}

test_payment_budget_not_found() {
  parse_response "$(curl_api GET /api/payments/budgets/00000000-0000-0000-0000-000000000000)"
  assert_status 404
}

test_payment_budget_check_allowed() {
  parse_response "$(curl_api POST /api/payments/budgets/$WALLET_ID/check -d '{"amount":"100","domain":"api.openai.com"}')"
  assert_status 200
  assert_json '.allowed' 'true'
}

test_payment_budget_check_missing_amount() {
  parse_response "$(curl_api POST /api/payments/budgets/$WALLET_ID/check -d '{"domain":"x.com"}')"
  assert_status 400
}

# ============================================================================
# DEFI
# ============================================================================

test_defi_swap_encode() {
  parse_response "$(curl_api POST /api/defi/swap/encode -d '{
    "chainId":8453,
    "tokenIn":"0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    "tokenOut":"0x4200000000000000000000000000000000000006",
    "amountIn":"1000000",
    "minAmountOut":"0",
    "recipient":"0x0000000000000000000000000000000000000001"
  }')"
  assert_status 200
  assert_exists '.result.to'
  assert_exists '.result.data'
  assert_exists '.result.value'
}

test_defi_swap_missing_fields() {
  parse_response "$(curl_api POST /api/defi/swap/encode -d '{"chainId":8453}')"
  assert_status 400
}

test_defi_supply_encode() {
  parse_response "$(curl_api POST /api/defi/supply/encode -d '{
    "chainId":8453,
    "asset":"0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    "amount":"1000000",
    "onBehalfOf":"0x0000000000000000000000000000000000000001"
  }')"
  assert_status 200
  assert_exists '.result.to'
  assert_exists '.result.data'
}

test_defi_supply_missing_fields() {
  parse_response "$(curl_api POST /api/defi/supply/encode -d '{"chainId":8453}')"
  assert_status 400
}

test_defi_borrow_encode() {
  parse_response "$(curl_api POST /api/defi/borrow/encode -d '{
    "chainId":8453,
    "asset":"0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    "amount":"500000",
    "onBehalfOf":"0x0000000000000000000000000000000000000001"
  }')"
  assert_status 200
  assert_exists '.result.to'
  assert_exists '.result.data'
}

test_defi_repay_encode() {
  parse_response "$(curl_api POST /api/defi/repay/encode -d '{
    "chainId":8453,
    "asset":"0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    "amount":"500000",
    "onBehalfOf":"0x0000000000000000000000000000000000000001"
  }')"
  assert_status 200
  assert_exists '.result.to'
  assert_exists '.result.data'
}

test_defi_approve_encode() {
  parse_response "$(curl_api POST /api/defi/approve/encode -d '{
    "token":"0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    "spender":"0x0000000000000000000000000000000000000001",
    "amount":"1000000"
  }')"
  assert_status 200
  assert_exists '.result.to'
  assert_exists '.result.data'
}

test_defi_approve_missing_fields() {
  parse_response "$(curl_api POST /api/defi/approve/encode -d '{}')"
  assert_status 400
}

# ============================================================================
# ANALYTICS
# ============================================================================

test_analytics_spending() {
  parse_response "$(curl_api GET /api/analytics/spending)"
  assert_status 200
  assert_type '.spending' 'array'
}

test_analytics_spending_daily() {
  parse_response "$(curl_api GET '/api/analytics/spending?period=daily')"
  assert_status 200
  assert_type '.spending' 'array'
}

test_analytics_spending_hourly() {
  parse_response "$(curl_api GET '/api/analytics/spending?period=hourly')"
  assert_status 200
  assert_type '.spending' 'array'
}

test_analytics_spending_weekly() {
  parse_response "$(curl_api GET '/api/analytics/spending?period=weekly')"
  assert_status 200
  assert_type '.spending' 'array'
}

test_analytics_spending_monthly() {
  parse_response "$(curl_api GET '/api/analytics/spending?period=monthly')"
  assert_status 200
  assert_type '.spending' 'array'
}

test_analytics_spending_by_wallet() {
  parse_response "$(curl_api GET /api/analytics/spending?walletId=$WALLET_ID)"
  assert_status 200
  assert_type '.spending' 'array'
}

test_analytics_spending_by_agent() {
  parse_response "$(curl_api GET /api/analytics/spending?agentId=$AGENT_ID)"
  assert_status 200
  assert_type '.spending' 'array'
}

test_analytics_agents() {
  parse_response "$(curl_api GET /api/analytics/agents)"
  assert_status 200
  assert_type '.agents' 'array'
}

test_analytics_agents_by_wallet() {
  parse_response "$(curl_api GET /api/analytics/agents?walletId=$WALLET_ID)"
  assert_status 200
  assert_type '.agents' 'array'
}

test_analytics_agents_sort_spent() {
  parse_response "$(curl_api GET '/api/analytics/agents?sortBy=spent')"
  assert_status 200
  assert_type '.agents' 'array'
}

test_analytics_agents_sort_transactions() {
  parse_response "$(curl_api GET '/api/analytics/agents?sortBy=transactions')"
  assert_status 200
  assert_type '.agents' 'array'
}

test_analytics_agents_sort_recent() {
  parse_response "$(curl_api GET '/api/analytics/agents?sortBy=recent')"
  assert_status 200
  assert_type '.agents' 'array'
}

test_analytics_agents_limit() {
  parse_response "$(curl_api GET '/api/analytics/agents?limit=1')"
  assert_status 200
  assert_type '.agents' 'array'
}

# ============================================================================
# CLEANUP
# ============================================================================

test_cleanup_agents() {
  parse_response "$(curl_api DELETE /api/agents/$AGENT_ID)"
  assert_status 200
  if [[ -n "$THIRD_AGENT_ID" ]]; then
    curl_api DELETE "/api/agents/$THIRD_AGENT_ID" > /dev/null 2>&1 || true
  fi
}

test_cleanup_policies() {
  local all_policies
  all_policies=$(curl -s -H "X-API-KEY: $API_KEY" "$BASE_URL/api/policies" | jq -r '.policies[].id // empty' 2>/dev/null)
  for id in $all_policies; do
    curl -s -X DELETE -H "X-API-KEY: $API_KEY" "$BASE_URL/api/policies/$id" > /dev/null 2>&1
  done
  parse_response "$(curl_api GET /api/policies)"
  assert_status 200
  assert_json '.total' '0'
}

test_cleanup_wallet() {
  parse_response "$(curl_api DELETE /api/wallets/$WALLET_ID)"
  assert_status 200
}

test_cleanup_verify_wallets_empty() {
  parse_response "$(curl_api GET /api/wallets)"
  assert_status 200
  assert_json '.total' '0'
}

test_cleanup_verify_agents_empty() {
  parse_response "$(curl_api GET /api/agents)"
  assert_status 200
  assert_json '.total' '0'
}

# ============================================================================
# RUNNER
# ============================================================================

echo ""
echo -e "${BOLD}${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo -e "${BOLD}${CYAN}  Sigloop REST API Integration Tests${RESET}"
echo -e "${BOLD}${CYAN}  $BASE_URL${RESET}"
echo -e "${BOLD}${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"

echo -ne "\n  Resetting server state... "
reset_server
echo -e "${GREEN}done${RESET}"

section "Health"
run_test "GET  /api/health returns ok" test_health_ok
run_test "GET  /api/health returns version 0.1.0" test_health_version

section "Authentication"
run_test "GET  /api/wallets without key → 401" test_auth_missing_key
run_test "GET  /api/wallets with wrong key → 403" test_auth_invalid_key
run_test "GET  /api/wallets with valid key → 200" test_auth_valid_key

section "Wallets"
run_test "POST /api/wallets creates wallet" test_wallet_create
run_test "POST /api/wallets with default chainId" test_wallet_create_default_chain
run_test "POST /api/wallets missing name → 400" test_wallet_create_missing_name
run_test "GET  /api/wallets lists all" test_wallet_list
run_test "GET  /api/wallets/:id returns wallet" test_wallet_get
run_test "GET  /api/wallets/:id not found → 404" test_wallet_get_not_found
run_test "POST /api/wallets/:id/sign-message signs" test_wallet_sign_message
run_test "POST /api/wallets/:id/sign-message missing → 400" test_wallet_sign_message_missing
run_test "DEL  /api/wallets/:id deletes wallet" test_wallet_delete_second
run_test "DEL  /api/wallets/:id not found → 404" test_wallet_delete_not_found

section "Policies"
run_test "POST /api/policies creates agent policy" test_policy_create_agent
run_test "POST /api/policies creates x402 policy" test_policy_create_x402
run_test "POST /api/policies creates spending policy" test_policy_create_spending
run_test "POST /api/policies missing name → 400" test_policy_create_missing_name
run_test "POST /api/policies missing type → 400" test_policy_create_missing_type
run_test "POST /api/policies missing config → 400" test_policy_create_missing_config
run_test "POST /api/policies invalid type → 400" test_policy_create_invalid_type
run_test "POST /api/policies x402 incomplete → 400" test_policy_create_x402_missing_fields
run_test "GET  /api/policies lists all" test_policy_list
run_test "GET  /api/policies/:id returns policy" test_policy_get
run_test "GET  /api/policies/:id not found → 404" test_policy_get_not_found
run_test "PUT  /api/policies/:id updates name" test_policy_update
run_test "PUT  /api/policies/:id not found → 404" test_policy_update_not_found
run_test "POST /api/policies/:id/encode encodes agent" test_policy_encode
run_test "POST /api/policies/:id/encode encodes x402" test_policy_encode_x402
run_test "POST /api/policies/compose merges policies" test_policy_compose
run_test "POST /api/policies/compose empty → 400" test_policy_compose_empty

section "Agents"
run_test "POST /api/agents/wallets/:wid/agents creates" test_agent_create
run_test "POST /api/agents/wallets/:wid/agents with policy" test_agent_create_with_policy
run_test "POST /api/agents/wallets/:wid/agents with duration" test_agent_create_with_duration
run_test "POST /api/agents/wallets/:wid/agents no name → 400" test_agent_create_missing_name
run_test "POST /api/agents/wallets/:wid/agents bad wallet → 404" test_agent_create_invalid_wallet
run_test "POST /api/agents/wallets/:wid/agents bad policy → 404" test_agent_create_invalid_policy
run_test "GET  /api/agents lists all" test_agent_list
run_test "GET  /api/agents?walletId filters" test_agent_list_by_wallet
run_test "GET  /api/agents/:id returns agent" test_agent_get
run_test "GET  /api/agents/:id not found → 404" test_agent_get_not_found
run_test "GET  /api/agents/:id/session returns session" test_agent_get_session
run_test "GET  /api/agents/:id/policy returns policy" test_agent_get_policy
run_test "GET  /api/agents/:id/policy returns null" test_agent_get_policy_none
run_test "POST /api/agents/:id/revoke revokes" test_agent_revoke
run_test "POST /api/agents/:id/revoke already → 409" test_agent_revoke_already
run_test "DEL  /api/agents/:id deletes" test_agent_delete
run_test "DEL  /api/agents/:id not found → 404" test_agent_delete_not_found

section "Payments"
run_test "POST /api/payments creates payment" test_payment_create
run_test "POST /api/payments defaults currency USDC" test_payment_create_default_currency
run_test "POST /api/payments third payment" test_payment_create_third
run_test "POST /api/payments missing agentId → 400" test_payment_create_missing_agent
run_test "POST /api/payments missing walletId → 400" test_payment_create_missing_wallet
run_test "POST /api/payments missing domain → 400" test_payment_create_missing_domain
run_test "POST /api/payments missing amount → 400" test_payment_create_missing_amount
run_test "POST /api/payments agent not found → 404" test_payment_create_agent_not_found
run_test "GET  /api/payments lists all" test_payment_list
run_test "GET  /api/payments?agentId filters" test_payment_list_by_agent
run_test "GET  /api/payments?walletId filters" test_payment_list_by_wallet
run_test "GET  /api/payments?domain filters" test_payment_list_by_domain
run_test "GET  /api/payments/stats returns stats" test_payment_stats
run_test "GET  /api/payments/budgets/:wid returns budget" test_payment_budget_get
run_test "GET  /api/payments/budgets/:wid not found → 404" test_payment_budget_not_found
run_test "POST /api/payments/budgets/:wid/check allowed" test_payment_budget_check_allowed
run_test "POST /api/payments/budgets/:wid/check no amt → 400" test_payment_budget_check_missing_amount

section "DeFi"
run_test "POST /api/defi/swap/encode encodes swap" test_defi_swap_encode
run_test "POST /api/defi/swap/encode missing fields → 400" test_defi_swap_missing_fields
run_test "POST /api/defi/supply/encode encodes supply" test_defi_supply_encode
run_test "POST /api/defi/supply/encode missing → 400" test_defi_supply_missing_fields
run_test "POST /api/defi/borrow/encode encodes borrow" test_defi_borrow_encode
run_test "POST /api/defi/repay/encode encodes repay" test_defi_repay_encode
run_test "POST /api/defi/approve/encode encodes approve" test_defi_approve_encode
run_test "POST /api/defi/approve/encode missing → 400" test_defi_approve_missing_fields

section "Analytics"
run_test "GET  /api/analytics/spending default" test_analytics_spending
run_test "GET  /api/analytics/spending?period=daily" test_analytics_spending_daily
run_test "GET  /api/analytics/spending?period=hourly" test_analytics_spending_hourly
run_test "GET  /api/analytics/spending?period=weekly" test_analytics_spending_weekly
run_test "GET  /api/analytics/spending?period=monthly" test_analytics_spending_monthly
run_test "GET  /api/analytics/spending?walletId" test_analytics_spending_by_wallet
run_test "GET  /api/analytics/spending?agentId" test_analytics_spending_by_agent
run_test "GET  /api/analytics/agents default" test_analytics_agents
run_test "GET  /api/analytics/agents?walletId" test_analytics_agents_by_wallet
run_test "GET  /api/analytics/agents?sortBy=spent" test_analytics_agents_sort_spent
run_test "GET  /api/analytics/agents?sortBy=transactions" test_analytics_agents_sort_transactions
run_test "GET  /api/analytics/agents?sortBy=recent" test_analytics_agents_sort_recent
run_test "GET  /api/analytics/agents?limit=1" test_analytics_agents_limit

section "Cleanup"
run_test "DEL  agents" test_cleanup_agents
run_test "DEL  all policies" test_cleanup_policies
run_test "DEL  wallet" test_cleanup_wallet
run_test "verify wallets empty" test_cleanup_verify_wallets_empty
run_test "verify agents empty" test_cleanup_verify_agents_empty

echo ""
echo -e "${BOLD}${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
TOTAL=$((PASSED + FAILED))
echo -e "${BOLD}  Results: ${GREEN}$PASSED passed${RESET}, ${RED}$FAILED failed${RESET} / $TOTAL total"
if [[ ${#FAILURES[@]} -gt 0 ]]; then
  echo ""
  echo -e "  ${RED}Failed:${RESET}"
  for f in "${FAILURES[@]}"; do
    echo -e "    ${RED}- $f${RESET}"
  done
fi
echo -e "${BOLD}${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo ""

if [[ $FAILED -gt 0 ]]; then
  exit 1
fi

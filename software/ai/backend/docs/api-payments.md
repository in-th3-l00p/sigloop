# Payments API

[<- Back to README](./README.md) | [Policies API](./api-policies.md) | [Analytics API ->](./api-analytics.md)

---

Payment endpoints are mounted at `/api/payments`. Authentication via `X-API-KEY` header is required for every request.

A **Payment** records a transaction made by an agent from a wallet to a specific domain. Payments are always created with status `"completed"`. The system validates that the agent belongs to the specified wallet.

---

## POST /api/payments

Record a new payment transaction.

### Request Headers

| Header         | Required | Description                  |
|----------------|----------|------------------------------|
| `X-API-KEY`    | Yes      | API key for authentication.  |
| `Content-Type` | Yes      | Must be `application/json`.  |

### Request Body

| Field      | Type                      | Required | Default  | Description                                     |
|------------|---------------------------|----------|----------|-------------------------------------------------|
| `agentId`  | `string`                  | Yes      | --       | UUID of the agent making the payment.           |
| `walletId` | `string`                  | Yes      | --       | UUID of the wallet funding the payment.         |
| `domain`   | `string`                  | Yes      | --       | Domain receiving the payment (e.g., `"api.openai.com"`). |
| `amount`   | `string`                  | Yes      | --       | Payment amount as a string (must be positive).  |
| `currency` | `string`                  | No       | `"USDC"` | Currency of the payment.                        |
| `metadata` | `Record<string, string>`  | No       | `{}`     | Arbitrary key-value metadata.                   |

### Request Body Example

```json
{
  "agentId": "d4e5f6a7-b8c9-0123-def4-567890123456",
  "walletId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "domain": "api.openai.com",
  "amount": "0.025000",
  "currency": "USDC",
  "metadata": {
    "model": "gpt-4",
    "tokens": "1500"
  }
}
```

### Response -- `201 Created`

```json
{
  "payment": {
    "id": "e5f6a7b8-c9d0-1234-ef56-789012345678",
    "agentId": "d4e5f6a7-b8c9-0123-def4-567890123456",
    "walletId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "domain": "api.openai.com",
    "amount": "0.025000",
    "currency": "USDC",
    "status": "completed",
    "metadata": {
      "model": "gpt-4",
      "tokens": "1500"
    },
    "createdAt": "2026-02-23T10:45:00.000Z"
  }
}
```

### Error Responses

| Status | Condition                          | Body |
|--------|------------------------------------|------|
| `400`  | Missing or empty `agentId`         | `{"error":"Bad Request","message":"agentId is required","status":400}` |
| `400`  | Missing or empty `walletId`        | `{"error":"Bad Request","message":"walletId is required","status":400}` |
| `400`  | Missing or empty `domain`          | `{"error":"Bad Request","message":"domain is required","status":400}` |
| `400`  | Missing `amount`                   | `{"error":"Bad Request","message":"amount is required","status":400}` |
| `400`  | Invalid amount (not positive)      | `{"error":"Bad Request","message":"amount must be a positive number","status":400}` |
| `401`  | Missing `X-API-KEY`                | `{"error":"Unauthorized","message":"Missing X-API-KEY header","status":401}` |
| `403`  | Invalid `X-API-KEY`                | `{"error":"Forbidden","message":"Invalid API key","status":403}` |
| `404`  | Agent not found                    | `{"error":"Not Found","message":"Agent not found: <agentId>","status":404}` |
| `404`  | Wallet not found                   | `{"error":"Not Found","message":"Wallet not found: <walletId>","status":404}` |
| `500`  | Agent does not belong to wallet    | `{"error":"Internal Server Error","message":"Agent does not belong to the specified wallet","status":500}` |
| `429`  | Rate limit exceeded                | `{"error":"Too Many Requests","message":"Rate limit exceeded. Please try again later.","status":429}` |

### curl Example

```bash
curl -X POST http://localhost:3001/api/payments \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: sigloop-dev-key" \
  -d '{
    "agentId": "d4e5f6a7-b8c9-0123-def4-567890123456",
    "walletId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "domain": "api.openai.com",
    "amount": "0.025000",
    "currency": "USDC",
    "metadata": {"model": "gpt-4", "tokens": "1500"}
  }'
```

---

## GET /api/payments

List payments with optional filters. Results are sorted by creation date (newest first).

### Query Parameters

| Parameter   | Type     | Required | Description                                       |
|-------------|----------|----------|---------------------------------------------------|
| `agentId`   | `string` | No       | Filter by agent UUID.                             |
| `walletId`  | `string` | No       | Filter by wallet UUID.                            |
| `domain`    | `string` | No       | Filter by exact domain match.                     |
| `startDate` | `string` | No       | Filter payments on or after this ISO 8601 date.   |
| `endDate`   | `string` | No       | Filter payments on or before this ISO 8601 date.  |

All filters are combined with AND logic.

### Request Headers

| Header      | Required | Description                  |
|-------------|----------|------------------------------|
| `X-API-KEY` | Yes      | API key for authentication.  |

### Response -- `200 OK`

```json
{
  "payments": [
    {
      "id": "e5f6a7b8-c9d0-1234-ef56-789012345678",
      "agentId": "d4e5f6a7-b8c9-0123-def4-567890123456",
      "walletId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "domain": "api.openai.com",
      "amount": "0.025000",
      "currency": "USDC",
      "status": "completed",
      "metadata": {
        "model": "gpt-4",
        "tokens": "1500"
      },
      "createdAt": "2026-02-23T10:45:00.000Z"
    }
  ],
  "total": 1
}
```

### Error Responses

| Status | Condition           | Body |
|--------|---------------------|------|
| `401`  | Missing `X-API-KEY` | `{"error":"Unauthorized","message":"Missing X-API-KEY header","status":401}` |
| `403`  | Invalid `X-API-KEY` | `{"error":"Forbidden","message":"Invalid API key","status":403}` |
| `429`  | Rate limit exceeded | `{"error":"Too Many Requests","message":"Rate limit exceeded. Please try again later.","status":429}` |

### curl Examples

```bash
# List all payments
curl http://localhost:3001/api/payments \
  -H "X-API-KEY: sigloop-dev-key"

# Filter by agent
curl "http://localhost:3001/api/payments?agentId=d4e5f6a7-b8c9-0123-def4-567890123456" \
  -H "X-API-KEY: sigloop-dev-key"

# Filter by wallet and domain
curl "http://localhost:3001/api/payments?walletId=a1b2c3d4-e5f6-7890-abcd-ef1234567890&domain=api.openai.com" \
  -H "X-API-KEY: sigloop-dev-key"

# Filter by date range
curl "http://localhost:3001/api/payments?startDate=2026-02-01T00:00:00Z&endDate=2026-02-28T23:59:59Z" \
  -H "X-API-KEY: sigloop-dev-key"
```

---

## GET /api/payments/stats

Get aggregate payment statistics including totals, breakdowns by agent, domain, and period (daily).

### Request Headers

| Header      | Required | Description                  |
|-------------|----------|------------------------------|
| `X-API-KEY` | Yes      | API key for authentication.  |

### Response -- `200 OK`

```json
{
  "stats": {
    "totalSpent": "125.500000",
    "totalTransactions": 47,
    "byAgent": {
      "d4e5f6a7-b8c9-0123-def4-567890123456": {
        "spent": "75.300000",
        "count": 30
      },
      "f6a7b8c9-d0e1-2345-f678-901234567890": {
        "spent": "50.200000",
        "count": 17
      }
    },
    "byDomain": {
      "api.openai.com": {
        "spent": "100.000000",
        "count": 40
      },
      "api.anthropic.com": {
        "spent": "25.500000",
        "count": 7
      }
    },
    "byPeriod": [
      {
        "period": "2026-02-21",
        "spent": "45.200000",
        "count": 15
      },
      {
        "period": "2026-02-22",
        "spent": "55.100000",
        "count": 20
      },
      {
        "period": "2026-02-23",
        "spent": "25.200000",
        "count": 12
      }
    ]
  }
}
```

### Error Responses

| Status | Condition           | Body |
|--------|---------------------|------|
| `401`  | Missing `X-API-KEY` | `{"error":"Unauthorized","message":"Missing X-API-KEY header","status":401}` |
| `403`  | Invalid `X-API-KEY` | `{"error":"Forbidden","message":"Invalid API key","status":403}` |
| `429`  | Rate limit exceeded | `{"error":"Too Many Requests","message":"Rate limit exceeded. Please try again later.","status":429}` |

### curl Example

```bash
curl http://localhost:3001/api/payments/stats \
  -H "X-API-KEY: sigloop-dev-key"
```

---

## Related

- [Types: Payment](./types.md#payment)
- [Services: PaymentService](./services.md#paymentservice)
- [Store: paymentsStore](./store.md#paymentsstore)
- [Analytics API](./api-analytics.md) -- For more advanced analytics

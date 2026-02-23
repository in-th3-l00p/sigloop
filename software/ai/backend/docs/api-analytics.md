# Analytics API

[<- Back to README](./README.md) | [Payments API](./api-payments.md)

---

Analytics endpoints are mounted at `/api/analytics`. Authentication via `X-API-KEY` header is required for every request.

The analytics API provides spending trend data and per-agent activity summaries built from the payment records.

---

## GET /api/analytics/spending

Get spending data aggregated by time period. Returns an array of data points, each containing the period label, total amount spent, and transaction count.

### Query Parameters

| Parameter   | Type     | Required | Default   | Description                                                      |
|-------------|----------|----------|-----------|------------------------------------------------------------------|
| `period`    | `string` | No       | `"daily"` | Aggregation granularity: `"hourly"`, `"daily"`, `"weekly"`, or `"monthly"`. |
| `startDate` | `string` | No       | --        | Filter payments on or after this ISO 8601 datetime.              |
| `endDate`   | `string` | No       | --        | Filter payments on or before this ISO 8601 datetime.             |
| `walletId`  | `string` | No       | --        | Filter by wallet UUID.                                           |
| `agentId`   | `string` | No       | --        | Filter by agent UUID.                                            |

### Request Headers

| Header      | Required | Description                  |
|-------------|----------|------------------------------|
| `X-API-KEY` | Yes      | API key for authentication.  |

### Response -- `200 OK`

```json
{
  "spending": [
    {
      "period": "2026-02-21",
      "totalSpent": "45.200000",
      "transactionCount": 15
    },
    {
      "period": "2026-02-22",
      "totalSpent": "55.100000",
      "transactionCount": 20
    },
    {
      "period": "2026-02-23",
      "totalSpent": "25.200000",
      "transactionCount": 12
    }
  ]
}
```

#### Period Format by Granularity

| Granularity | Format Example            | Description                     |
|-------------|---------------------------|---------------------------------|
| `hourly`    | `2026-02-23T14:00:00Z`   | ISO 8601 truncated to hour      |
| `daily`     | `2026-02-23`             | ISO 8601 date                   |
| `weekly`    | `2026-W02-17`            | Year-W-Monday date of the week  |
| `monthly`   | `2026-02`                | Year-month                      |

### Error Responses

| Status | Condition           | Body |
|--------|---------------------|------|
| `401`  | Missing `X-API-KEY` | `{"error":"Unauthorized","message":"Missing X-API-KEY header","status":401}` |
| `403`  | Invalid `X-API-KEY` | `{"error":"Forbidden","message":"Invalid API key","status":403}` |
| `429`  | Rate limit exceeded | `{"error":"Too Many Requests","message":"Rate limit exceeded. Please try again later.","status":429}` |

### curl Examples

```bash
# Daily spending (default)
curl http://localhost:3001/api/analytics/spending \
  -H "X-API-KEY: sigloop-dev-key"

# Hourly spending for a specific wallet
curl "http://localhost:3001/api/analytics/spending?period=hourly&walletId=a1b2c3d4-e5f6-7890-abcd-ef1234567890" \
  -H "X-API-KEY: sigloop-dev-key"

# Monthly spending within a date range
curl "http://localhost:3001/api/analytics/spending?period=monthly&startDate=2026-01-01T00:00:00Z&endDate=2026-02-28T23:59:59Z" \
  -H "X-API-KEY: sigloop-dev-key"

# Spending for a specific agent
curl "http://localhost:3001/api/analytics/spending?agentId=d4e5f6a7-b8c9-0123-def4-567890123456&period=weekly" \
  -H "X-API-KEY: sigloop-dev-key"
```

---

## GET /api/analytics/agents

Get agent activity summaries showing spending, transaction counts, active domains, and last activity timestamps. Results are sorted and limited.

### Query Parameters

| Parameter  | Type     | Required | Default   | Description                                           |
|------------|----------|----------|-----------|-------------------------------------------------------|
| `walletId` | `string` | No       | --        | Filter agents belonging to this wallet.               |
| `limit`    | `number` | No       | `50`      | Maximum number of agents to return.                   |
| `sortBy`   | `string` | No       | `"spent"` | Sort order: `"spent"`, `"transactions"`, or `"recent"`. |

#### Sort Options

| Value          | Description                                      |
|----------------|--------------------------------------------------|
| `spent`        | Sort by total amount spent, descending.          |
| `transactions` | Sort by transaction count, descending.           |
| `recent`       | Sort by last activity timestamp, most recent first. Agents with no activity are sorted last. |

### Request Headers

| Header      | Required | Description                  |
|-------------|----------|------------------------------|
| `X-API-KEY` | Yes      | API key for authentication.  |

### Response -- `200 OK`

```json
{
  "agents": [
    {
      "agentId": "d4e5f6a7-b8c9-0123-def4-567890123456",
      "name": "Shopping Agent",
      "walletId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "totalSpent": "75.300000",
      "transactionCount": 30,
      "lastActive": "2026-02-23T10:45:00.000Z",
      "domains": ["api.openai.com", "api.anthropic.com"]
    },
    {
      "agentId": "f6a7b8c9-d0e1-2345-f678-901234567890",
      "name": "Research Agent",
      "walletId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "totalSpent": "50.200000",
      "transactionCount": 17,
      "lastActive": "2026-02-22T18:30:00.000Z",
      "domains": ["api.openai.com"]
    },
    {
      "agentId": "a7b8c9d0-e1f2-3456-7890-123456789012",
      "name": "Idle Agent",
      "walletId": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
      "totalSpent": "0.000000",
      "transactionCount": 0,
      "lastActive": null,
      "domains": []
    }
  ]
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
# All agents sorted by spending (default)
curl http://localhost:3001/api/analytics/agents \
  -H "X-API-KEY: sigloop-dev-key"

# Top 5 agents by transaction count for a specific wallet
curl "http://localhost:3001/api/analytics/agents?walletId=a1b2c3d4-e5f6-7890-abcd-ef1234567890&limit=5&sortBy=transactions" \
  -H "X-API-KEY: sigloop-dev-key"

# Most recently active agents
curl "http://localhost:3001/api/analytics/agents?sortBy=recent&limit=10" \
  -H "X-API-KEY: sigloop-dev-key"
```

---

## Related

- [Payments API](./api-payments.md) -- Raw payment data and basic stats
- [Services: AnalyticsService](./services.md#analyticsservice)
- [Types: Payment](./types.md#payment)

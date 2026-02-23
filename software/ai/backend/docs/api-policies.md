# Policies API

[<- Back to README](./README.md) | [Agents API](./api-agents.md) | [Payments API ->](./api-payments.md)

---

Policy endpoints are mounted at `/api/policies`. Authentication via `X-API-KEY` header is required for every request.

A **Policy** is a named set of rules that constrain what an agent can do. Policies can contain three types of rules: `spending_limit`, `allowlist`, and `time_window`. Policies can be attached to agents at creation time.

---

## POST /api/policies

Create a new policy with one or more rules.

### Request Headers

| Header         | Required | Description                  |
|----------------|----------|------------------------------|
| `X-API-KEY`    | Yes      | API key for authentication.  |
| `Content-Type` | Yes      | Must be `application/json`.  |

### Request Body

| Field         | Type           | Required | Default | Description                                 |
|---------------|----------------|----------|---------|---------------------------------------------|
| `name`        | `string`       | Yes      | --      | Human-readable name for the policy.         |
| `description` | `string`       | No       | `""`    | Description of the policy's purpose.        |
| `rules`       | `PolicyRule[]`  | Yes      | --      | Array of rules (at least one required).     |

#### PolicyRule Object

| Field           | Type             | Required | Description                                     |
|-----------------|------------------|----------|-------------------------------------------------|
| `type`          | `string`         | Yes      | One of: `"spending_limit"`, `"allowlist"`, `"time_window"`. |
| `spendingLimit` | `SpendingLimit`  | Cond.    | Required when `type` is `"spending_limit"`.     |
| `allowlist`     | `Allowlist`      | Cond.    | Required when `type` is `"allowlist"`.          |
| `timeWindow`    | `TimeWindow`     | Cond.    | Required when `type` is `"time_window"`.        |

#### SpendingLimit Object

| Field       | Type     | Required | Description                                       |
|-------------|----------|----------|---------------------------------------------------|
| `maxAmount` | `string` | Yes      | Maximum amount (must be a positive number string). |
| `period`    | `string` | Yes      | One of: `"hourly"`, `"daily"`, `"weekly"`, `"monthly"`. |
| `currency`  | `string` | Yes      | Currency symbol (e.g., `"USDC"`, `"ETH"`).        |

#### Allowlist Object

| Field       | Type       | Required | Description                                          |
|-------------|------------|----------|------------------------------------------------------|
| `addresses` | `string[]` | Yes      | Allowed Ethereum addresses (can be empty if `domains` is not). |
| `domains`   | `string[]` | Yes      | Allowed domain names (can be empty if `addresses` is not).     |

> At least one of `addresses` or `domains` must be non-empty.

#### TimeWindow Object

| Field        | Type       | Required | Description                                |
|--------------|------------|----------|--------------------------------------------|
| `startHour`  | `number`   | Yes      | Start hour (0-23 inclusive).               |
| `endHour`    | `number`   | Yes      | End hour (0-23 inclusive).                 |
| `daysOfWeek` | `number[]` | Yes      | Days of week (0=Sunday through 6=Saturday).|
| `timezone`   | `string`   | Yes      | Timezone identifier (e.g., `"UTC"`).       |

### Request Body Example

```json
{
  "name": "Conservative Spending Policy",
  "description": "Limits daily spending and restricts to known domains",
  "rules": [
    {
      "type": "spending_limit",
      "spendingLimit": {
        "maxAmount": "100.00",
        "period": "daily",
        "currency": "USDC"
      }
    },
    {
      "type": "allowlist",
      "allowlist": {
        "addresses": [],
        "domains": ["api.openai.com", "api.anthropic.com"]
      }
    },
    {
      "type": "time_window",
      "timeWindow": {
        "startHour": 9,
        "endHour": 17,
        "daysOfWeek": [1, 2, 3, 4, 5],
        "timezone": "UTC"
      }
    }
  ]
}
```

### Response -- `201 Created`

```json
{
  "policy": {
    "id": "c3d4e5f6-a7b8-9012-cdef-345678901234",
    "name": "Conservative Spending Policy",
    "description": "Limits daily spending and restricts to known domains",
    "rules": [
      {
        "type": "spending_limit",
        "spendingLimit": {
          "maxAmount": "100.00",
          "period": "daily",
          "currency": "USDC"
        }
      },
      {
        "type": "allowlist",
        "allowlist": {
          "addresses": [],
          "domains": ["api.openai.com", "api.anthropic.com"]
        }
      },
      {
        "type": "time_window",
        "timeWindow": {
          "startHour": 9,
          "endHour": 17,
          "daysOfWeek": [1, 2, 3, 4, 5],
          "timezone": "UTC"
        }
      }
    ],
    "createdAt": "2026-02-23T10:00:00.000Z",
    "updatedAt": "2026-02-23T10:00:00.000Z"
  }
}
```

### Error Responses

| Status | Condition                          | Body |
|--------|------------------------------------|------|
| `400`  | Missing or empty `name`            | `{"error":"Bad Request","message":"Policy name is required","status":400}` |
| `400`  | Missing or empty `rules` array     | `{"error":"Bad Request","message":"At least one policy rule is required","status":400}` |
| `400`  | Invalid rule `type`                | `{"error":"Bad Request","message":"Invalid rule type: <type>","status":400}` |
| `400`  | `spending_limit` without config    | `{"error":"Bad Request","message":"spending_limit rule requires spendingLimit configuration","status":400}` |
| `400`  | Invalid `maxAmount`                | `{"error":"Bad Request","message":"spendingLimit.maxAmount must be a positive number","status":400}` |
| `400`  | Invalid `period`                   | `{"error":"Bad Request","message":"Invalid period: <period>","status":400}` |
| `400`  | `allowlist` without config         | `{"error":"Bad Request","message":"allowlist rule requires allowlist configuration","status":400}` |
| `400`  | Empty allowlist                    | `{"error":"Bad Request","message":"Allowlist must contain at least one address or domain","status":400}` |
| `400`  | `time_window` without config       | `{"error":"Bad Request","message":"time_window rule requires timeWindow configuration","status":400}` |
| `400`  | Invalid `startHour` or `endHour`   | `{"error":"Bad Request","message":"startHour must be between 0 and 23","status":400}` |
| `401`  | Missing `X-API-KEY`                | `{"error":"Unauthorized","message":"Missing X-API-KEY header","status":401}` |
| `403`  | Invalid `X-API-KEY`                | `{"error":"Forbidden","message":"Invalid API key","status":403}` |
| `429`  | Rate limit exceeded                | `{"error":"Too Many Requests","message":"Rate limit exceeded. Please try again later.","status":429}` |

### curl Example

```bash
curl -X POST http://localhost:3001/api/policies \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: sigloop-dev-key" \
  -d '{
    "name": "Conservative Spending Policy",
    "description": "Limits daily spending and restricts to known domains",
    "rules": [
      {
        "type": "spending_limit",
        "spendingLimit": {
          "maxAmount": "100.00",
          "period": "daily",
          "currency": "USDC"
        }
      }
    ]
  }'
```

---

## GET /api/policies

List all policies.

### Request Headers

| Header      | Required | Description                  |
|-------------|----------|------------------------------|
| `X-API-KEY` | Yes      | API key for authentication.  |

### Response -- `200 OK`

```json
{
  "policies": [
    {
      "id": "c3d4e5f6-a7b8-9012-cdef-345678901234",
      "name": "Conservative Spending Policy",
      "description": "Limits daily spending and restricts to known domains",
      "rules": [
        {
          "type": "spending_limit",
          "spendingLimit": {
            "maxAmount": "100.00",
            "period": "daily",
            "currency": "USDC"
          }
        }
      ],
      "createdAt": "2026-02-23T10:00:00.000Z",
      "updatedAt": "2026-02-23T10:00:00.000Z"
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

### curl Example

```bash
curl http://localhost:3001/api/policies \
  -H "X-API-KEY: sigloop-dev-key"
```

---

## GET /api/policies/:id

Get a single policy by its ID.

### Path Parameters

| Parameter | Type     | Description              |
|-----------|----------|--------------------------|
| `id`      | `string` | UUID of the policy.      |

### Request Headers

| Header      | Required | Description                  |
|-------------|----------|------------------------------|
| `X-API-KEY` | Yes      | API key for authentication.  |

### Response -- `200 OK`

```json
{
  "policy": {
    "id": "c3d4e5f6-a7b8-9012-cdef-345678901234",
    "name": "Conservative Spending Policy",
    "description": "Limits daily spending and restricts to known domains",
    "rules": [
      {
        "type": "spending_limit",
        "spendingLimit": {
          "maxAmount": "100.00",
          "period": "daily",
          "currency": "USDC"
        }
      }
    ],
    "createdAt": "2026-02-23T10:00:00.000Z",
    "updatedAt": "2026-02-23T10:00:00.000Z"
  }
}
```

### Error Responses

| Status | Condition           | Body |
|--------|---------------------|------|
| `401`  | Missing `X-API-KEY` | `{"error":"Unauthorized","message":"Missing X-API-KEY header","status":401}` |
| `403`  | Invalid `X-API-KEY` | `{"error":"Forbidden","message":"Invalid API key","status":403}` |
| `404`  | Policy not found    | `{"error":"Not Found","message":"Policy not found: <id>","status":404}` |
| `429`  | Rate limit exceeded | `{"error":"Too Many Requests","message":"Rate limit exceeded. Please try again later.","status":429}` |

### curl Example

```bash
curl http://localhost:3001/api/policies/c3d4e5f6-a7b8-9012-cdef-345678901234 \
  -H "X-API-KEY: sigloop-dev-key"
```

---

## PUT /api/policies/:id

Update an existing policy. All fields are optional -- only provided fields are updated.

### Path Parameters

| Parameter | Type     | Description              |
|-----------|----------|--------------------------|
| `id`      | `string` | UUID of the policy.      |

### Request Headers

| Header         | Required | Description                  |
|----------------|----------|------------------------------|
| `X-API-KEY`    | Yes      | API key for authentication.  |
| `Content-Type` | Yes      | Must be `application/json`.  |

### Request Body

| Field         | Type           | Required | Description                                 |
|---------------|----------------|----------|---------------------------------------------|
| `name`        | `string`       | No       | Updated name for the policy.                |
| `description` | `string`       | No       | Updated description.                        |
| `rules`       | `PolicyRule[]`  | No       | Replacement rules (validated same as create).|

### Request Body Example

```json
{
  "name": "Updated Policy Name",
  "rules": [
    {
      "type": "spending_limit",
      "spendingLimit": {
        "maxAmount": "250.00",
        "period": "weekly",
        "currency": "USDC"
      }
    }
  ]
}
```

### Response -- `200 OK`

```json
{
  "policy": {
    "id": "c3d4e5f6-a7b8-9012-cdef-345678901234",
    "name": "Updated Policy Name",
    "description": "Limits daily spending and restricts to known domains",
    "rules": [
      {
        "type": "spending_limit",
        "spendingLimit": {
          "maxAmount": "250.00",
          "period": "weekly",
          "currency": "USDC"
        }
      }
    ],
    "createdAt": "2026-02-23T10:00:00.000Z",
    "updatedAt": "2026-02-23T11:00:00.000Z"
  }
}
```

### Error Responses

| Status | Condition                       | Body |
|--------|---------------------------------|------|
| `400`  | Empty `rules` array             | `{"error":"Bad Request","message":"At least one policy rule is required","status":400}` |
| `400`  | Invalid rule (see POST errors)  | _(same validation as POST)_ |
| `401`  | Missing `X-API-KEY`             | `{"error":"Unauthorized","message":"Missing X-API-KEY header","status":401}` |
| `403`  | Invalid `X-API-KEY`             | `{"error":"Forbidden","message":"Invalid API key","status":403}` |
| `404`  | Policy not found                | `{"error":"Not Found","message":"Policy not found: <id>","status":404}` |
| `429`  | Rate limit exceeded             | `{"error":"Too Many Requests","message":"Rate limit exceeded. Please try again later.","status":429}` |

### curl Example

```bash
curl -X PUT http://localhost:3001/api/policies/c3d4e5f6-a7b8-9012-cdef-345678901234 \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: sigloop-dev-key" \
  -d '{"name": "Updated Policy Name"}'
```

---

## DELETE /api/policies/:id

Delete a policy by its ID.

### Path Parameters

| Parameter | Type     | Description              |
|-----------|----------|--------------------------|
| `id`      | `string` | UUID of the policy.      |

### Request Headers

| Header      | Required | Description                  |
|-------------|----------|------------------------------|
| `X-API-KEY` | Yes      | API key for authentication.  |

### Response -- `200 OK`

```json
{
  "message": "Policy deleted"
}
```

### Error Responses

| Status | Condition           | Body |
|--------|---------------------|------|
| `401`  | Missing `X-API-KEY` | `{"error":"Unauthorized","message":"Missing X-API-KEY header","status":401}` |
| `403`  | Invalid `X-API-KEY` | `{"error":"Forbidden","message":"Invalid API key","status":403}` |
| `404`  | Policy not found    | `{"error":"Not Found","message":"Policy not found: <id>","status":404}` |
| `429`  | Rate limit exceeded | `{"error":"Too Many Requests","message":"Rate limit exceeded. Please try again later.","status":429}` |

### curl Example

```bash
curl -X DELETE http://localhost:3001/api/policies/c3d4e5f6-a7b8-9012-cdef-345678901234 \
  -H "X-API-KEY: sigloop-dev-key"
```

---

## Related

- [Types: Policy](./types.md#policy)
- [Services: PolicyService](./services.md#policyservice)
- [Store: policiesStore](./store.md#policiesstore)

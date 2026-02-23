# Wallets API

[<- Back to README](./README.md) | [Agents API ->](./api-agents.md)

---

All wallet endpoints are mounted at `/api/wallets`. Authentication via `X-API-KEY` header is required for every request.

---

## POST /api/wallets

Create a new wallet. Generates an Ethereum private key and derives the public address.

### Request Headers

| Header      | Required | Description                  |
|-------------|----------|------------------------------|
| `X-API-KEY` | Yes      | API key for authentication.  |
| `Content-Type` | Yes   | Must be `application/json`.  |

### Request Body

| Field     | Type     | Required | Default | Description                          |
|-----------|----------|----------|---------|--------------------------------------|
| `name`    | `string` | Yes      | --      | Human-readable name for the wallet.  |
| `chainId` | `number` | No       | `1`     | EVM chain ID (1 = Ethereum mainnet). |

### Request Body Example

```json
{
  "name": "Treasury Wallet",
  "chainId": 137
}
```

### Response -- `201 Created`

```json
{
  "wallet": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "address": "0x1234567890abcdef1234567890abcdef12345678",
    "name": "Treasury Wallet",
    "chainId": 137,
    "createdAt": "2026-02-23T10:00:00.000Z",
    "updatedAt": "2026-02-23T10:00:00.000Z"
  }
}
```

### Error Responses

| Status | Condition                  | Body                                                                  |
|--------|----------------------------|-----------------------------------------------------------------------|
| `400`  | Missing or empty `name`    | `{"error":"Bad Request","message":"Wallet name is required","status":400}` |
| `401`  | Missing `X-API-KEY`        | `{"error":"Unauthorized","message":"Missing X-API-KEY header","status":401}` |
| `403`  | Invalid `X-API-KEY`        | `{"error":"Forbidden","message":"Invalid API key","status":403}`      |
| `429`  | Rate limit exceeded        | `{"error":"Too Many Requests","message":"Rate limit exceeded. Please try again later.","status":429}` |

### curl Example

```bash
curl -X POST http://localhost:3001/api/wallets \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: sigloop-dev-key" \
  -d '{"name": "Treasury Wallet", "chainId": 137}'
```

---

## GET /api/wallets

List all wallets.

### Request Headers

| Header      | Required | Description                  |
|-------------|----------|------------------------------|
| `X-API-KEY` | Yes      | API key for authentication.  |

### Response -- `200 OK`

```json
{
  "wallets": [
    {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "address": "0x1234567890abcdef1234567890abcdef12345678",
      "name": "Treasury Wallet",
      "chainId": 137,
      "createdAt": "2026-02-23T10:00:00.000Z",
      "updatedAt": "2026-02-23T10:00:00.000Z"
    },
    {
      "id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
      "address": "0xabcdef1234567890abcdef1234567890abcdef12",
      "name": "Operations Wallet",
      "chainId": 1,
      "createdAt": "2026-02-23T09:00:00.000Z",
      "updatedAt": "2026-02-23T09:00:00.000Z"
    }
  ],
  "total": 2
}
```

### Error Responses

| Status | Condition                  | Body                                                                  |
|--------|----------------------------|-----------------------------------------------------------------------|
| `401`  | Missing `X-API-KEY`        | `{"error":"Unauthorized","message":"Missing X-API-KEY header","status":401}` |
| `403`  | Invalid `X-API-KEY`        | `{"error":"Forbidden","message":"Invalid API key","status":403}`      |
| `429`  | Rate limit exceeded        | `{"error":"Too Many Requests","message":"Rate limit exceeded. Please try again later.","status":429}` |

### curl Example

```bash
curl http://localhost:3001/api/wallets \
  -H "X-API-KEY: sigloop-dev-key"
```

---

## GET /api/wallets/:id

Get a single wallet by its ID.

### Path Parameters

| Parameter | Type     | Description              |
|-----------|----------|--------------------------|
| `id`      | `string` | UUID of the wallet.      |

### Request Headers

| Header      | Required | Description                  |
|-------------|----------|------------------------------|
| `X-API-KEY` | Yes      | API key for authentication.  |

### Response -- `200 OK`

```json
{
  "wallet": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "address": "0x1234567890abcdef1234567890abcdef12345678",
    "name": "Treasury Wallet",
    "chainId": 137,
    "createdAt": "2026-02-23T10:00:00.000Z",
    "updatedAt": "2026-02-23T10:00:00.000Z"
  }
}
```

### Error Responses

| Status | Condition                  | Body                                                                  |
|--------|----------------------------|-----------------------------------------------------------------------|
| `401`  | Missing `X-API-KEY`        | `{"error":"Unauthorized","message":"Missing X-API-KEY header","status":401}` |
| `403`  | Invalid `X-API-KEY`        | `{"error":"Forbidden","message":"Invalid API key","status":403}`      |
| `404`  | Wallet not found           | `{"error":"Not Found","message":"Wallet not found: <id>","status":404}` |
| `429`  | Rate limit exceeded        | `{"error":"Too Many Requests","message":"Rate limit exceeded. Please try again later.","status":429}` |

### curl Example

```bash
curl http://localhost:3001/api/wallets/a1b2c3d4-e5f6-7890-abcd-ef1234567890 \
  -H "X-API-KEY: sigloop-dev-key"
```

---

## DELETE /api/wallets/:id

Delete a wallet by its ID.

### Path Parameters

| Parameter | Type     | Description              |
|-----------|----------|--------------------------|
| `id`      | `string` | UUID of the wallet.      |

### Request Headers

| Header      | Required | Description                  |
|-------------|----------|------------------------------|
| `X-API-KEY` | Yes      | API key for authentication.  |

### Response -- `200 OK`

```json
{
  "message": "Wallet deleted"
}
```

### Error Responses

| Status | Condition                  | Body                                                                  |
|--------|----------------------------|-----------------------------------------------------------------------|
| `401`  | Missing `X-API-KEY`        | `{"error":"Unauthorized","message":"Missing X-API-KEY header","status":401}` |
| `403`  | Invalid `X-API-KEY`        | `{"error":"Forbidden","message":"Invalid API key","status":403}`      |
| `404`  | Wallet not found           | `{"error":"Not Found","message":"Wallet not found: <id>","status":404}` |
| `429`  | Rate limit exceeded        | `{"error":"Too Many Requests","message":"Rate limit exceeded. Please try again later.","status":429}` |

### curl Example

```bash
curl -X DELETE http://localhost:3001/api/wallets/a1b2c3d4-e5f6-7890-abcd-ef1234567890 \
  -H "X-API-KEY: sigloop-dev-key"
```

---

## Related

- [Types: Wallet](./types.md#wallet)
- [Services: WalletService](./services.md#walletservice)
- [Store: walletsStore](./store.md#walletsstore)

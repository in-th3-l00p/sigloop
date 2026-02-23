# Agents API

[<- Back to README](./README.md) | [Wallets API](./api-wallets.md) | [Policies API ->](./api-policies.md)

---

Agent endpoints are mounted at `/api/agents`. Authentication via `X-API-KEY` header is required for every request.

An **Agent** represents a scoped session key bound to a specific wallet. Agents can have policies attached and specific permissions granted. When created, the agent receives a session key (private key) that is returned once and should be securely stored by the caller.

---

## POST /api/agents/wallets/:walletId/agents

Create a new agent for a specific wallet. Generates a cryptographic key pair: the public key is stored with the agent record, and the private key (session key) is returned in the response.

### Path Parameters

| Parameter  | Type     | Description                   |
|------------|----------|-------------------------------|
| `walletId` | `string` | UUID of the parent wallet.    |

### Request Headers

| Header         | Required | Description                  |
|----------------|----------|------------------------------|
| `X-API-KEY`    | Yes      | API key for authentication.  |
| `Content-Type` | Yes      | Must be `application/json`.  |

### Request Body

| Field         | Type       | Required | Default | Description                                      |
|---------------|------------|----------|---------|--------------------------------------------------|
| `name`        | `string`   | Yes      | --      | Human-readable name for the agent.               |
| `policyId`    | `string`   | No       | `null`  | UUID of an existing policy to attach.             |
| `permissions` | `string[]` | No       | `[]`    | Array of permission strings granted to the agent. |

### Request Body Example

```json
{
  "name": "Shopping Agent",
  "policyId": "c3d4e5f6-a7b8-9012-cdef-345678901234",
  "permissions": ["pay", "read_balance"]
}
```

### Response -- `201 Created`

```json
{
  "agent": {
    "id": "d4e5f6a7-b8c9-0123-def4-567890123456",
    "walletId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "name": "Shopping Agent",
    "publicKey": "0xabcdef1234567890abcdef1234567890abcdef12",
    "policyId": "c3d4e5f6-a7b8-9012-cdef-345678901234",
    "status": "active",
    "permissions": ["pay", "read_balance"],
    "createdAt": "2026-02-23T10:30:00.000Z",
    "updatedAt": "2026-02-23T10:30:00.000Z",
    "revokedAt": null
  },
  "sessionKey": "0x4c0883a69102937d6231471b5dbb6204fe512961708279f157a8d6b0b1e7a3e8"
}
```

> **Important:** The `sessionKey` is returned only during creation. Store it securely -- it cannot be retrieved again.

### Error Responses

| Status | Condition                    | Body                                                                  |
|--------|------------------------------|-----------------------------------------------------------------------|
| `400`  | Missing or empty `name`      | `{"error":"Bad Request","message":"Agent name is required","status":400}` |
| `401`  | Missing `X-API-KEY`          | `{"error":"Unauthorized","message":"Missing X-API-KEY header","status":401}` |
| `403`  | Invalid `X-API-KEY`          | `{"error":"Forbidden","message":"Invalid API key","status":403}`      |
| `404`  | Wallet not found             | `{"error":"Not Found","message":"Wallet not found: <walletId>","status":404}` |
| `404`  | Policy not found             | `{"error":"Not Found","message":"Policy not found: <policyId>","status":404}` |
| `429`  | Rate limit exceeded          | `{"error":"Too Many Requests","message":"Rate limit exceeded. Please try again later.","status":429}` |

### curl Example

```bash
curl -X POST http://localhost:3001/api/agents/wallets/a1b2c3d4-e5f6-7890-abcd-ef1234567890/agents \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: sigloop-dev-key" \
  -d '{
    "name": "Shopping Agent",
    "policyId": "c3d4e5f6-a7b8-9012-cdef-345678901234",
    "permissions": ["pay", "read_balance"]
  }'
```

---

## GET /api/agents

List all agents, optionally filtered by wallet.

### Query Parameters

| Parameter  | Type     | Required | Description                              |
|------------|----------|----------|------------------------------------------|
| `walletId` | `string` | No       | Filter agents belonging to this wallet.  |

### Request Headers

| Header      | Required | Description                  |
|-------------|----------|------------------------------|
| `X-API-KEY` | Yes      | API key for authentication.  |

### Response -- `200 OK`

```json
{
  "agents": [
    {
      "id": "d4e5f6a7-b8c9-0123-def4-567890123456",
      "walletId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "name": "Shopping Agent",
      "publicKey": "0xabcdef1234567890abcdef1234567890abcdef12",
      "policyId": "c3d4e5f6-a7b8-9012-cdef-345678901234",
      "status": "active",
      "permissions": ["pay", "read_balance"],
      "createdAt": "2026-02-23T10:30:00.000Z",
      "updatedAt": "2026-02-23T10:30:00.000Z",
      "revokedAt": null
    }
  ],
  "total": 1
}
```

### Error Responses

| Status | Condition                  | Body                                                                  |
|--------|----------------------------|-----------------------------------------------------------------------|
| `401`  | Missing `X-API-KEY`        | `{"error":"Unauthorized","message":"Missing X-API-KEY header","status":401}` |
| `403`  | Invalid `X-API-KEY`        | `{"error":"Forbidden","message":"Invalid API key","status":403}`      |
| `429`  | Rate limit exceeded        | `{"error":"Too Many Requests","message":"Rate limit exceeded. Please try again later.","status":429}` |

### curl Examples

```bash
# List all agents
curl http://localhost:3001/api/agents \
  -H "X-API-KEY: sigloop-dev-key"

# List agents for a specific wallet
curl "http://localhost:3001/api/agents?walletId=a1b2c3d4-e5f6-7890-abcd-ef1234567890" \
  -H "X-API-KEY: sigloop-dev-key"
```

---

## GET /api/agents/:id

Get a single agent by its ID.

### Path Parameters

| Parameter | Type     | Description             |
|-----------|----------|-------------------------|
| `id`      | `string` | UUID of the agent.      |

### Request Headers

| Header      | Required | Description                  |
|-------------|----------|------------------------------|
| `X-API-KEY` | Yes      | API key for authentication.  |

### Response -- `200 OK`

```json
{
  "agent": {
    "id": "d4e5f6a7-b8c9-0123-def4-567890123456",
    "walletId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "name": "Shopping Agent",
    "publicKey": "0xabcdef1234567890abcdef1234567890abcdef12",
    "policyId": "c3d4e5f6-a7b8-9012-cdef-345678901234",
    "status": "active",
    "permissions": ["pay", "read_balance"],
    "createdAt": "2026-02-23T10:30:00.000Z",
    "updatedAt": "2026-02-23T10:30:00.000Z",
    "revokedAt": null
  }
}
```

### Error Responses

| Status | Condition                  | Body                                                                  |
|--------|----------------------------|-----------------------------------------------------------------------|
| `401`  | Missing `X-API-KEY`        | `{"error":"Unauthorized","message":"Missing X-API-KEY header","status":401}` |
| `403`  | Invalid `X-API-KEY`        | `{"error":"Forbidden","message":"Invalid API key","status":403}`      |
| `404`  | Agent not found            | `{"error":"Not Found","message":"Agent not found: <id>","status":404}` |
| `429`  | Rate limit exceeded        | `{"error":"Too Many Requests","message":"Rate limit exceeded. Please try again later.","status":429}` |

### curl Example

```bash
curl http://localhost:3001/api/agents/d4e5f6a7-b8c9-0123-def4-567890123456 \
  -H "X-API-KEY: sigloop-dev-key"
```

---

## DELETE /api/agents/:id

Delete an agent by its ID. Also deletes the agent's key material from the key manager.

### Path Parameters

| Parameter | Type     | Description             |
|-----------|----------|-------------------------|
| `id`      | `string` | UUID of the agent.      |

### Request Headers

| Header      | Required | Description                  |
|-------------|----------|------------------------------|
| `X-API-KEY` | Yes      | API key for authentication.  |

### Response -- `200 OK`

```json
{
  "message": "Agent deleted"
}
```

### Error Responses

| Status | Condition                  | Body                                                                  |
|--------|----------------------------|-----------------------------------------------------------------------|
| `401`  | Missing `X-API-KEY`        | `{"error":"Unauthorized","message":"Missing X-API-KEY header","status":401}` |
| `403`  | Invalid `X-API-KEY`        | `{"error":"Forbidden","message":"Invalid API key","status":403}`      |
| `404`  | Agent not found            | `{"error":"Not Found","message":"Agent not found: <id>","status":404}` |
| `429`  | Rate limit exceeded        | `{"error":"Too Many Requests","message":"Rate limit exceeded. Please try again later.","status":429}` |

### curl Example

```bash
curl -X DELETE http://localhost:3001/api/agents/d4e5f6a7-b8c9-0123-def4-567890123456 \
  -H "X-API-KEY: sigloop-dev-key"
```

---

## POST /api/agents/:id/revoke

Revoke an active agent. Sets the agent status to `"revoked"`, records the revocation timestamp, and deletes the agent's key material from the key manager. The agent record itself is preserved.

### Path Parameters

| Parameter | Type     | Description             |
|-----------|----------|-------------------------|
| `id`      | `string` | UUID of the agent.      |

### Request Headers

| Header      | Required | Description                  |
|-------------|----------|------------------------------|
| `X-API-KEY` | Yes      | API key for authentication.  |

### Response -- `200 OK`

```json
{
  "agent": {
    "id": "d4e5f6a7-b8c9-0123-def4-567890123456",
    "walletId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "name": "Shopping Agent",
    "publicKey": "0xabcdef1234567890abcdef1234567890abcdef12",
    "policyId": "c3d4e5f6-a7b8-9012-cdef-345678901234",
    "status": "revoked",
    "permissions": ["pay", "read_balance"],
    "createdAt": "2026-02-23T10:30:00.000Z",
    "updatedAt": "2026-02-23T11:00:00.000Z",
    "revokedAt": "2026-02-23T11:00:00.000Z"
  }
}
```

### Error Responses

| Status | Condition                  | Body                                                                  |
|--------|----------------------------|-----------------------------------------------------------------------|
| `401`  | Missing `X-API-KEY`        | `{"error":"Unauthorized","message":"Missing X-API-KEY header","status":401}` |
| `403`  | Invalid `X-API-KEY`        | `{"error":"Forbidden","message":"Invalid API key","status":403}`      |
| `404`  | Agent not found            | `{"error":"Not Found","message":"Agent not found: <id>","status":404}` |
| `409`  | Agent already revoked      | `{"error":"Conflict","message":"Agent is already revoked: <id>","status":409}` |
| `429`  | Rate limit exceeded        | `{"error":"Too Many Requests","message":"Rate limit exceeded. Please try again later.","status":429}` |

### curl Example

```bash
curl -X POST http://localhost:3001/api/agents/d4e5f6a7-b8c9-0123-def4-567890123456/revoke \
  -H "X-API-KEY: sigloop-dev-key"
```

---

## Related

- [Types: Agent](./types.md#agent)
- [Services: AgentService](./services.md#agentservice)
- [Store: agentsStore](./store.md#agentsstore)

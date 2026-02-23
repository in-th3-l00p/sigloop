# Middleware

[<- Back to README](./README.md) | [Services ->](./services.md)

---

The Sigloop backend uses three middleware layers that process requests in the following order:

```
Request
  |
  v
[1] CORS (applied globally to all routes)
  |
  v
[2] Rate Limiter (applied to all /api/* except /api/health)
  |
  v
[3] Auth Middleware (applied to all /api/* except /api/health)
  |
  v
Route Handler
  |
  v
[4] Error Handler (catches thrown errors from any layer)
  |
  v
Response
```

The `/api/health` endpoint is mounted before the rate limiter and auth middleware, so it is publicly accessible without authentication or rate limiting.

---

## Authentication Middleware

**Source:** `src/middleware/auth.ts`

Validates the `X-API-KEY` request header against the configured API key.

### How It Works

1. Reads the `X-API-KEY` header from the incoming request.
2. If the header is missing, returns `401 Unauthorized`.
3. If the header value does not match `config.apiKey` (from the `API_KEY` environment variable, defaulting to `"sigloop-dev-key"`), returns `403 Forbidden`.
4. If the key matches, the request proceeds to the route handler.

### Error Responses

**Missing API key (`401`):**

```json
{
  "error": "Unauthorized",
  "message": "Missing X-API-KEY header",
  "status": 401
}
```

**Invalid API key (`403`):**

```json
{
  "error": "Forbidden",
  "message": "Invalid API key",
  "status": 403
}
```

### Configuration

| Environment Variable | Default            | Description                    |
|----------------------|--------------------|--------------------------------|
| `API_KEY`            | `"sigloop-dev-key"` | The expected API key value.    |

### Usage Example

```bash
# Correct authentication
curl -H "X-API-KEY: sigloop-dev-key" http://localhost:3001/api/wallets

# Missing header (returns 401)
curl http://localhost:3001/api/wallets

# Wrong key (returns 403)
curl -H "X-API-KEY: wrong-key" http://localhost:3001/api/wallets
```

---

## Rate Limiting Middleware

**Source:** `src/middleware/ratelimit.ts`

Implements a **token bucket** algorithm to limit request throughput per client IP address.

### How It Works

1. **Client identification:** Extracts the client IP from `X-Forwarded-For` (first entry), `X-Real-IP`, or falls back to `"unknown"`.
2. **Bucket initialization:** Each new IP gets a bucket with `100` tokens.
3. **Token refill:** On each request, tokens are added based on elapsed time since the last refill at a rate of `10 tokens per second`.
4. **Token consumption:** Each request consumes 1 token. If no tokens remain, the request is rejected with `429 Too Many Requests`.
5. **Response headers:** Rate limit information is added to every successful response.

### Configuration (Hard-coded Constants)

| Constant             | Value  | Description                              |
|----------------------|--------|------------------------------------------|
| `MAX_TOKENS`         | `100`  | Maximum tokens per bucket.               |
| `REFILL_RATE`        | `10`   | Tokens added per refill interval.        |
| `REFILL_INTERVAL_MS` | `1000` | Milliseconds between refill calculations.|

This means each client can sustain **10 requests/second** with a burst capacity of **100 requests**.

### Response Headers

Added to every successful (non-429) response:

| Header                  | Description                                  |
|-------------------------|----------------------------------------------|
| `X-RateLimit-Limit`     | Maximum tokens (`100`).                      |
| `X-RateLimit-Remaining` | Tokens remaining after this request.         |

### Error Response (`429`)

```json
{
  "error": "Too Many Requests",
  "message": "Rate limit exceeded. Please try again later.",
  "status": 429
}
```

### Behavior Notes

- Token buckets are stored in-memory and are reset when the server restarts.
- There is no distributed rate limiting -- each server instance maintains its own buckets.
- The bucket for an IP is created on first request and is never explicitly evicted.

---

## Error Handler

**Source:** `src/middleware/error.ts`

A global error handler registered via `app.onError()`. It catches any unhandled errors thrown by route handlers or services and maps them to appropriate HTTP status codes based on the error message content.

### How It Works

The error handler inspects the `message` property of the thrown error and categorizes it:

| Message Contains           | HTTP Status | Error Label            |
|---------------------------|-------------|------------------------|
| `"not found"`             | `404`       | `"Not Found"`          |
| `"required"`, `"must be"`, `"Invalid"` | `400` | `"Bad Request"` |
| `"already"`               | `409`       | `"Conflict"`           |
| _(anything else)_         | `500`       | `"Internal Server Error"` |

### Response Format

All error responses follow this structure:

```json
{
  "error": "<Error Label>",
  "message": "<Original error message>",
  "status": <HTTP status code>
}
```

### Examples

**404 Not Found** (triggered by `throw new Error("Wallet not found: abc")`):

```json
{
  "error": "Not Found",
  "message": "Wallet not found: abc",
  "status": 404
}
```

**400 Bad Request** (triggered by `throw new Error("Wallet name is required")`):

```json
{
  "error": "Bad Request",
  "message": "Wallet name is required",
  "status": 400
}
```

**409 Conflict** (triggered by `throw new Error("Agent is already revoked: abc")`):

```json
{
  "error": "Conflict",
  "message": "Agent is already revoked: abc",
  "status": 409
}
```

**500 Internal Server Error** (any other error):

```json
{
  "error": "Internal Server Error",
  "message": "Something unexpected happened",
  "status": 500
}
```

---

## CORS

**Source:** `src/index.ts`

CORS is enabled globally for all routes using Hono's built-in `cors()` middleware with default settings. This allows cross-origin requests from any origin.

```typescript
app.use("/*", cors());
```

---

## Health Endpoint

**Source:** `src/routes/health.ts`

The health check endpoint is mounted before the rate limiter and auth middleware, making it publicly accessible.

### GET /api/health

```json
{
  "status": "ok",
  "timestamp": "2026-02-23T12:00:00.000Z",
  "version": "0.1.0"
}
```

```bash
curl http://localhost:3001/api/health
```

---

## Related

- [Getting Started](./getting-started.md) -- Environment variable configuration
- [Services](./services.md) -- Service layer that throws the errors caught by the error handler

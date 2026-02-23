# Getting Started

[<- Back to README](./README.md)

---

## Prerequisites

- **Node.js** >= 20
- **pnpm** >= 10.30.1 (the project enforces this via `packageManager` in `package.json`)

---

## Installation

```bash
# Clone the repository and navigate to the backend
cd software/ai/backend

# Install dependencies
pnpm install
```

---

## Environment Variables

| Variable             | Required | Default            | Description                                     |
|----------------------|----------|--------------------|-------------------------------------------------|
| `PORT`               | No       | `3001`             | HTTP port the server listens on.                |
| `DATABASE_URL`       | No       | `""`               | Database connection string (reserved for future use). |
| `ZERODEV_PROJECT_ID` | No       | `""`               | ZeroDev project ID for smart account integration. |
| `API_KEY`            | No       | `"sigloop-dev-key"` | API key required in the `X-API-KEY` header.     |
| `BUNDLER_URL`        | No       | `""`               | ERC-4337 bundler URL (reserved for future use). |

Create a `.env` file in the backend root (optional):

```env
PORT=3001
API_KEY=my-secret-api-key
ZERODEV_PROJECT_ID=your-project-id
BUNDLER_URL=https://bundler.example.com
DATABASE_URL=postgresql://user:pass@localhost:5432/sigloop
```

> **Note:** The server reads environment variables directly via `process.env`. No `.env` loader is included by default; set variables in your shell or use a process manager.

---

## Running the Server

### Development (hot reload)

```bash
pnpm dev
```

Uses `tsx watch` to automatically restart on file changes. The server starts on `http://localhost:3001`.

### Production

```bash
pnpm start
```

Uses `tsx` to run the TypeScript source directly.

### Build (TypeScript compilation)

```bash
pnpm build
```

Compiles TypeScript to JavaScript in the `./dist` directory. Output target is ES2022.

### Type Check

```bash
pnpm typecheck
```

Runs `tsc --noEmit` to validate types without producing output files.

---

## Docker

The project includes a Dockerfile for containerized deployment.

### Dockerfile

```dockerfile
FROM node:20-alpine
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
EXPOSE 3001
CMD ["pnpm", "tsx", "src/index.ts"]
```

### Build and Run

```bash
# Build the image
docker build -t sigloop-backend .

# Run the container
docker run -d \
  -p 3001:3001 \
  -e API_KEY=my-secret-api-key \
  -e ZERODEV_PROJECT_ID=your-project-id \
  --name sigloop-backend \
  sigloop-backend
```

### Verify

```bash
curl http://localhost:3001/api/health
```

Expected response:

```json
{
  "status": "ok",
  "timestamp": "2026-02-23T12:00:00.000Z",
  "version": "0.1.0"
}
```

---

## Project Structure

```
src/
├── index.ts                 # Application entry point (Hono app, CORS, error handler)
├── config/
│   └── index.ts             # Configuration (env vars with defaults)
├── middleware/
│   ├── auth.ts              # API key authentication middleware
│   ├── error.ts             # Global error handler
│   └── ratelimit.ts         # Token bucket rate limiter
├── routes/
│   ├── index.ts             # Route aggregator (mounts all sub-routers)
│   ├── health.ts            # GET /api/health
│   ├── wallets.ts           # Wallet CRUD endpoints
│   ├── agents.ts            # Agent CRUD + revoke endpoints
│   ├── policies.ts          # Policy CRUD endpoints
│   ├── payments.ts          # Payment recording and querying
│   └── analytics.ts         # Spending and agent activity analytics
├── services/
│   ├── wallet.service.ts    # Wallet business logic
│   ├── agent.service.ts     # Agent business logic
│   ├── policy.service.ts    # Policy business logic + rule validation
│   ├── payment.service.ts   # Payment recording, filtering, stats
│   ├── analytics.service.ts # Spending aggregation, agent activity
│   └── keymanager.service.ts# Key pair generation and storage
├── store/
│   ├── index.ts             # Store barrel export
│   ├── wallets.store.ts     # In-memory wallet store
│   ├── agents.store.ts      # In-memory agent store
│   ├── policies.store.ts    # In-memory policy store
│   └── payments.store.ts    # In-memory payment store
└── types/
    ├── index.ts             # Type barrel export
    ├── wallet.ts            # Wallet interfaces
    ├── agent.ts             # Agent interfaces and enums
    ├── policy.ts            # Policy, rule, and constraint interfaces
    └── payment.ts           # Payment interfaces
```

---

## Technology Stack

| Technology | Purpose                    |
|------------|----------------------------|
| Hono       | HTTP framework (lightweight, web-standard) |
| @hono/node-server | Node.js adapter for Hono |
| viem       | Ethereum key generation (private key, account addresses) |
| tsx        | TypeScript execution without compilation step |
| TypeScript | Static type system          |
| pnpm       | Package manager             |

---

## Next Steps

- [Wallets API](./api-wallets.md) -- Create your first wallet
- [Agents API](./api-agents.md) -- Provision an agent with session keys
- [Policies API](./api-policies.md) -- Define spending rules
- [Middleware](./middleware.md) -- Understand authentication and rate limiting

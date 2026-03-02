# Deployment

Local development uses Docker Compose with five services. Production deployment targets Node.js with AWS KMS for key management.

---

## Docker Compose (Development)

**Location:** `software/ai/docker-compose.yml`

### Services

```
┌──────────────────────────────────────────────────────────┐
│                   Docker Network: sigloop-dev              │
│                                                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐   │
│  │   anvil     │  │   backend   │  │     webapp       │   │
│  │   :8545     │  │   :3001     │  │     :5173        │   │
│  │             │  │             │  │                   │   │
│  │  Foundry    │  │  Hono API   │  │  React + Vite    │   │
│  │  local      │  │  REST +     │  │  dashboard       │   │
│  │  blockchain │  │  GraphQL +  │  │                   │   │
│  │             │  │  WebSocket  │  │                   │   │
│  └─────────────┘  └─────────────┘  └─────────────────┘   │
│                                                            │
│  ┌─────────────┐  ┌──────────────────────────────────┐    │
│  │    rest     │  │    contract-deployer              │    │
│  │   :3002     │  │    (runs once, exits)             │    │
│  │             │  │                                    │    │
│  │  Flow       │  │  Deploys 4 ERC-7579 modules      │    │
│  │  orchestr.  │  │  to Anvil via forge script        │    │
│  └─────────────┘  └──────────────────────────────────┘    │
└──────────────────────────────────────────────────────────┘
```

### Service Details

#### anvil (Local Blockchain)

| Property       | Value                                      |
|----------------|--------------------------------------------|
| Image          | `ghcr.io/foundry-rs/foundry`               |
| Port           | 8545                                       |
| Chain ID       | 31337                                      |
| Accounts       | 10 pre-funded                              |
| Balance        | 10,000 ETH each                            |
| Health check   | `cast chain-id --rpc-url http://localhost:8545` |

#### backend (API Service)

| Property       | Value                                      |
|----------------|--------------------------------------------|
| Build          | `software/backend/`                        |
| Port           | 3001                                       |
| Depends on     | anvil (healthy)                            |
| Health check   | `GET /api/health`                          |
| Environment    | `ANVIL_RPC_URL`, `CHAIN_ID`, `API_KEY`    |

#### webapp (Dashboard)

| Property       | Value                                      |
|----------------|--------------------------------------------|
| Build          | `software/ai/webapp/`                      |
| Port           | 5173                                       |
| Depends on     | backend (healthy)                          |
| Environment    | `VITE_API_URL`, `VITE_ANVIL_RPC_URL`, `VITE_CHAIN_ID` |

#### rest (Flow Orchestration)

| Property       | Value                                      |
|----------------|--------------------------------------------|
| Build          | `software/ai/rest/`                        |
| Port           | 3002                                       |
| Depends on     | backend (healthy)                          |
| Health check   | `GET /api/health`                          |
| Environment    | `BACKEND_URL=http://backend:3001`          |

#### contract-deployer (One-Shot)

| Property       | Value                                      |
|----------------|--------------------------------------------|
| Image          | `ghcr.io/foundry-rs/foundry`               |
| Depends on     | anvil (healthy)                            |
| Command        | `forge script Deploy.s.sol --broadcast --rpc-url http://anvil:8545` |
| Behavior       | Runs once, deploys 4 modules, exits        |

### Running

```bash
cd software/ai
docker compose up -d
```

Wait for all services:
```bash
docker compose ps
```

Access points:
- Backend API: http://localhost:3001/api
- GraphQL: http://localhost:3001/graphql
- WebSocket: ws://localhost:3001/ws
- Dashboard: http://localhost:5173
- Flow API: http://localhost:3002/api
- Anvil RPC: http://localhost:8545

---

## Standalone Backend (Development)

Run the backend without Docker:

```bash
cd software/backend

# Install dependencies (links local libraries via file: deps)
pnpm install

# Development with hot reload
pnpm dev

# Production start
pnpm start

# Type check
pnpm typecheck

# Run tests
pnpm test
```

### Environment Variables

| Variable              | Default                  | Description                    |
|-----------------------|--------------------------|--------------------------------|
| `PORT`                | `3001`                   | Server port                    |
| `API_KEY`             | `sigloop-dev-key`        | API key for X-API-KEY header   |
| `RPC_URL`             | `http://localhost:8545`  | Ethereum RPC endpoint          |
| `BUNDLER_URL`         | (empty)                  | ERC-4337 bundler URL           |
| `ZERODEV_PROJECT_ID`  | (empty)                  | ZeroDev project ID             |
| `DEFAULT_CHAIN_ID`    | `8453`                   | Default chain (Base)           |

---

## Library Development

Each library is an independent pnpm workspace. The backend links them via `file:` dependencies.

```bash
# Install a specific library's deps
cd software/lib/policy && pnpm install

# Run library tests
pnpm test

# Build
pnpm build
```

### Dependency Graph

```
@sigloop/wallet          → viem, @zerodev/sdk, @zerodev/ecdsa-validator
@sigloop/agent           → viem, @sigloop/policy
@sigloop/policy          → viem
@sigloop/x402            → viem
@sigloop/defi            → viem
@sigloop/wallet-server   → viem, @aws-sdk/client-kms
@sigloop/backend         → all six libraries above
```

---

## Smart Contract Deployment

### Local (Anvil)

```bash
cd testing/ai/contracts

# Run tests
forge test

# Deploy to Anvil
forge script script/Deploy.s.sol --broadcast --rpc-url http://localhost:8545
```

The deploy script logs contract addresses to stdout. These addresses are used by the integration tests.

### Testnet

```bash
forge script script/Deploy.s.sol \
  --broadcast \
  --rpc-url https://sepolia.base.org \
  --private-key $DEPLOYER_KEY \
  --verify \
  --etherscan-api-key $BASESCAN_KEY
```

---

## Production Considerations

### Key Management

Development uses `viem/accounts`'s `generatePrivateKey()` with keys stored in-memory. Production should use `@sigloop/wallet-server` backed by AWS KMS — private keys never leave the HSM.

### Persistence

The current backend uses in-memory Map stores. For production, replace the store implementations with a database backend (PostgreSQL, Redis, etc.) while keeping the same store interface.

### Supported Chains

| Chain     | Chain ID | Status     |
|-----------|----------|------------|
| Base      | 8453     | Primary    |
| Ethereum  | 1        | Supported  |
| Arbitrum  | 42161    | Supported  |
| Optimism  | 10       | Supported  |
| Anvil     | 31337    | Dev only   |

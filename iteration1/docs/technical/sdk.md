# SDKs

Two SDKs with feature parity: TypeScript and Go. Both wrap the core libraries into a client-friendly API for building AI agents that interact with the Sigloop platform.

---

## TypeScript SDK

**Location:** `software/ai/sdk-ts`
**Package:** `@sigloop/sdk`
**Files:** 39 source, 22 test (61 total)
**Stack:** TypeScript, viem, permissionless

### Module Structure

```
src/
├── wallet/          Wallet creation, passkey auth, social recovery
├── agent/           Session key agents, revocation, listing
├── policy/          Allowlists, spending limits, rate limits, time windows, composition
├── x402/            X402 client, budget tracking, payment signing, fetch middleware
├── chain/           Chain configs, routing, bridging
├── defi/            Swap, lending, staking wrappers
├── types/           Shared type definitions (one file per module)
└── utils/           ABI encoding, validation helpers
```

### wallet/

| Function        | Description                                             |
|-----------------|---------------------------------------------------------|
| `create`        | Deploy a new Kernel smart account with ZeroDev          |
| `passkey`       | Authenticate wallet via WebAuthn passkey                |
| `recover`       | Social recovery flow for lost keys                      |

### agent/

| Function        | Description                                             |
|-----------------|---------------------------------------------------------|
| `create`        | Provision a session-key agent with policy binding        |
| `session`       | Manage session key lifecycle and expiry                  |
| `revoke`        | Revoke an agent's session key                           |
| `list`          | Enumerate agents for a wallet                           |

### policy/

| Function        | Description                                             |
|-----------------|---------------------------------------------------------|
| `allowlist`     | Create address/contract allowlist policies              |
| `spending`      | Create spending limit policies                          |
| `ratelimit`     | Create rate limit policies                              |
| `timewindow`    | Create time-based restriction policies                  |
| `compose`       | AND/OR composition of multiple policies                 |

### x402/

| Function        | Description                                             |
|-----------------|---------------------------------------------------------|
| `client`        | Create x402 payment client                              |
| `budget`        | Budget tracking with daily reset                        |
| `payment`       | Payment signing (EIP-3009)                              |
| `middleware`     | Fetch wrapper for automatic 402 handling               |

### chain/

| Function        | Description                                             |
|-----------------|---------------------------------------------------------|
| `config`        | Chain configurations (Ethereum, Base, Optimism, Arbitrum) |
| `router`        | Select optimal chain based on gas/cost                  |
| `bridge`        | Cross-chain asset bridging                              |

### defi/

| Function        | Description                                             |
|-----------------|---------------------------------------------------------|
| `swap`          | Uniswap V3 swap interactions                            |
| `lending`       | Aave V3 supply, borrow, repay                           |
| `staking`       | Staking protocol interactions                           |

---

## Go SDK

**Location:** `software/ai/sdk-go`
**Module:** `github.com/sigloop/sdk-go`
**Files:** 27 source, 20 test (47 total)
**Stack:** Go, go-ethereum

### Package Structure

```
├── agent/           Agent creation, session keys, types
├── wallet/          Wallet operations, recovery, types
├── policy/          Allowlist, spending, composition, types
├── x402/            Client, budget, middleware, payment, types
├── chain/           Chain config, routing
├── defi/            Swap, lending, types
├── encoding/        ABI encoding, UserOp encoding
├── sigloop.go       Package root exports
└── sigloop_test.go  Integration tests
```

### agent/

| File          | Exports                                                  |
|---------------|----------------------------------------------------------|
| `agent.go`    | `NewAgent`, `LoadAgent` — create and restore agents      |
| `session.go`  | `GenerateSessionKey`, `IsActive` — key lifecycle         |
| `types.go`    | `Agent`, `SessionKey`, `CreateAgentConfig`                |

### wallet/

| File          | Exports                                                  |
|---------------|----------------------------------------------------------|
| `wallet.go`   | `NewWallet`, `LoadWallet`, `Sign`, `SendTransaction`     |
| `recovery.go` | `InitiateRecovery`, `CompleteRecovery`                   |
| `types.go`    | `Wallet`, `WalletConfig`, `TransactionRequest`            |

### policy/

| File           | Exports                                                 |
|----------------|---------------------------------------------------------|
| `policy.go`    | `NewAgentPolicy`, `NewX402Policy`, `Encode`, `Decode`   |
| `allowlist.go` | `NewAllowlistPolicy` — address whitelisting             |
| `spending.go`  | `NewSpendingPolicy` — daily/weekly caps                 |
| `compose.go`   | `ComposeAND`, `ComposeOR` — policy composition          |
| `types.go`     | `AgentPolicy`, `X402Policy`, `SpendingPolicy`            |

### x402/

| File            | Exports                                                |
|-----------------|--------------------------------------------------------|
| `client.go`     | `NewClient` — x402 payment client                      |
| `budget.go`     | `NewBudgetTracker`, `Check`, `Record` — budget mgmt    |
| `middleware.go`  | `WrapTransport` — http.RoundTripper that handles 402  |
| `payment.go`    | `SignPayment` — EIP-3009 signature construction        |
| `types.go`      | `Config`, `PaymentRequirement`, `BudgetState`          |

### chain/

| File         | Exports                                                   |
|--------------|-----------------------------------------------------------|
| `chain.go`   | `GetChain`, `ListChains`                                  |
| `config.go`  | `ChainConfig` — pre-configured chain definitions          |
| `router.go`  | `SelectOptimalChain` — gas-based chain selection          |

### defi/

| File         | Exports                                                   |
|--------------|-----------------------------------------------------------|
| `defi.go`    | `NewDeFiClient` — factory for all DeFi operations         |
| `swap.go`    | `EncodeSwap` — Uniswap V3 calldata encoding              |
| `lending.go` | `EncodeSupply`, `EncodeBorrow`, `EncodeRepay`             |
| `types.go`   | `SwapParams`, `LendingParams`, `EncodedCall`              |

### encoding/

| File         | Exports                                                   |
|--------------|-----------------------------------------------------------|
| `abi.go`     | `EncodeFunctionData`, `DecodeFunctionResult`              |
| `userop.go`  | `EncodeUserOp`, `HashUserOp`                              |

---

## SDK vs Libraries

The SDKs (`software/ai/sdk-ts`, `software/ai/sdk-go`) are client-facing packages designed for building agents. The core libraries (`software/lib/*`) are lower-level building blocks used by both the SDKs and the backend.

| Concern                   | Core Libraries         | SDKs                        |
|---------------------------|------------------------|-----------------------------|
| Target audience           | Backend, internal      | Agent developers            |
| Chain config              | Passed as parameter    | Built-in chain definitions  |
| Recovery                  | Not included           | Social recovery flows       |
| Passkey auth              | Not included           | WebAuthn integration        |
| Cross-chain routing       | Not included           | Optimal chain selection     |
| HTTP middleware            | x402 fetch wrapper    | Full transport wrapping     |

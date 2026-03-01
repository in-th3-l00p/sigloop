# Core Libraries

Six TypeScript libraries under `software/lib/`. All follow the same conventions: closure-based factories, no comments, `viem` as the sole blockchain dependency, three export entry points (`.`, `./advanced`, `./constants`).

---

## @sigloop/wallet

ERC-4337 smart account lifecycle using ZeroDev Kernel.

**Location:** `software/lib/wallet` (13 source files, 10 test files)

**Dependencies:** `viem`, `@zerodev/sdk`, `@zerodev/ecdsa-validator`

### Exports

| Function               | Description                                           |
|------------------------|-------------------------------------------------------|
| `createWallet`         | Deploy a new Kernel smart account                     |
| `loadWallet`           | Load an existing smart account by address             |
| `generatePrivateKey`   | Generate a random ECDSA private key                   |
| `encodeFunctionData`   | ABI-encode a function call for transaction data       |
| `getGasTokenAddress`   | Resolve gas token address for a given chain           |
| `getGasTokens`         | List available gas payment tokens per chain           |

### Types

| Type                 | Description                                             |
|----------------------|---------------------------------------------------------|
| `Wallet`             | Smart account instance with signing and send methods    |
| `TransactionRequest` | Transaction parameters (to, value, data)                |
| `CreateWalletConfig` | Config for wallet creation (chain, signer, paymaster)   |
| `LoadWalletConfig`   | Config for loading existing wallet                      |

### Internal Modules

- `account.ts` — Account initialization and Kernel config
- `client.ts` — Viem public/bundler client factory
- `signer.ts` — Private key generation via `viem/accounts`
- `signing.ts` — Message and typed data signing
- `transactions.ts` — Transaction encoding and submission
- `paymaster.ts` — Gas sponsorship via ZeroDev paymaster
- `validator.ts` — ECDSA validator module setup
- `gas.ts` — Gas token resolution per chain
- `advanced.ts` — Batch transactions, multi-call
- `constants.ts` — Chain configs, entry point addresses

---

## @sigloop/agent

Session key provisioning and management for AI agents.

**Location:** `software/lib/agent` (8 source files, 5 test files)

**Dependencies:** `viem`, `@sigloop/policy`

### Exports

| Function              | Description                                            |
|-----------------------|--------------------------------------------------------|
| `createAgent`         | Provision a new agent with a session key               |
| `loadAgent`           | Restore an agent from stored session key               |
| `getAgentPolicy`      | Retrieve the policy bound to an agent                  |
| `encodeRevokeAgent`   | Encode the on-chain revocation calldata                |
| `generateSessionKey`  | Generate a session key pair with expiry                |
| `isSessionKeyActive`  | Check if a session key is still within its validity window |
| `signUserOpAsAgent`   | Sign a UserOperation hash using the agent's session key |

### Types

| Type                | Description                                              |
|---------------------|----------------------------------------------------------|
| `Agent`             | Agent instance with signing capabilities                 |
| `SessionKey`        | Session key with address, private key, and expiry        |
| `CreateAgentConfig` | Config: wallet, policy, session duration                 |
| `LoadAgentConfig`   | Config for restoring an existing agent                   |

### Internal Modules

- `agent.ts` — Agent creation, loading, policy retrieval, revocation encoding
- `session.ts` — Session key generation and expiry validation
- `signing.ts` — UserOperation signing with session keys
- `module.ts` — ERC-7579 validator module instantiation for agents

---

## @sigloop/policy

Policy encoding, validation, and composition for ERC-7579 modules.

**Location:** `software/lib/policy` (8 source files, 5 test files)

**Dependencies:** `viem`

### Exports

| Function               | Description                                           |
|------------------------|-------------------------------------------------------|
| `createAgentPolicy`    | Create an agent permission policy                     |
| `createX402Policy`     | Create an x402 budget policy                          |
| `createSpendingPolicy` | Create a spending limit policy                        |
| `encodeAgentPolicy`    | ABI-encode an agent policy for on-chain installation  |
| `decodeAgentPolicy`    | Decode an on-chain agent policy back to config        |
| `encodeX402Budget`     | ABI-encode an x402 budget for on-chain installation   |
| `decodeX402Budget`     | Decode an on-chain x402 budget back to config         |
| `validateAgentPolicy`  | Validate policy config meets constraints              |
| `isPolicyActive`       | Check if a policy is within its time window           |

### Types

| Type                       | Description                                        |
|----------------------------|----------------------------------------------------|
| `AgentPolicy`              | Agent permission policy with targets, selectors, limits |
| `X402Budget`               | x402 budget with per-request, daily, and total caps |
| `SpendingLimit`            | Spending limit with daily/weekly reset periods      |
| `CreateAgentPolicyConfig`  | Config for allowed targets, selectors, amounts      |
| `CreateX402PolicyConfig`   | Config for budget caps and domain allowlist          |
| `CreateSpendingPolicyConfig` | Config for daily/weekly spending limits           |

### Internal Modules

- `policy.ts` — Factory functions for all three policy types
- `encoding.ts` — ABI encoding/decoding for on-chain policy data
- `validation.ts` — Config validation, time window checks
- `compose.ts` — AND/OR composition of multiple agent policies

### Policy Types

**Agent Policy** — Controls what an agent session key can do:
- `allowedTargets`: Contract addresses the agent may call
- `allowedSelectors`: Function selectors the agent may invoke
- `maxAmountPerTx`: Maximum value per transaction (bigint)
- `dailyLimit` / `weeklyLimit`: Spending caps with auto-reset
- `validAfter` / `validUntil`: Time window (unix timestamps)

**X402 Policy** — Controls x402 payment budgets:
- `maxPerRequest`: Maximum payment per API call
- `dailyBudget`: Daily spending cap
- `totalBudget`: Lifetime spending cap
- `allowedDomains`: Whitelist of API domains

**Spending Policy** — Controls token spending limits:
- `agent`: Bound agent address
- `token`: ERC-20 token address
- `dailyLimit` / `weeklyLimit`: Caps with period auto-reset

---

## @sigloop/x402

HTTP 402 Payment Required middleware — fetch interception, payment signing, and budget tracking.

**Location:** `software/lib/x402` (8 source files, 5 test files)

**Dependencies:** `viem`

### Exports

| Function              | Description                                           |
|-----------------------|-------------------------------------------------------|
| `createX402Client`    | Create an x402 payment client                         |
| `createX402Fetch`     | Wrap `fetch()` to intercept 402 responses and auto-pay |
| `parseX402Response`   | Parse payment requirement headers from a 402 response |
| `createBudgetTracker` | Create a budget tracker with daily reset and caps     |

### Types

| Type                    | Description                                          |
|-------------------------|------------------------------------------------------|
| `X402Config`            | Client config: signer, chain, budget settings        |
| `X402PaymentRequirement` | Parsed 402 header: amount, recipient, asset, domain |
| `BudgetTracker`         | Budget tracking instance with spend/check methods    |
| `BudgetTrackerConfig`   | Config for daily and total budget limits             |
| `BudgetState`           | Current spend state: total, daily, remaining         |
| `PaymentRecord`         | Recorded payment with amount, domain, timestamp      |

### Internal Modules

- `x402.ts` — Client factory, payment signing using EIP-3009 TransferWithAuthorization
- `middleware.ts` — Fetch wrapper that intercepts 402 responses, signs a payment, retries with payment header
- `budget.ts` — Budget tracker with daily auto-reset, remaining calculation, overage detection
- `payment.ts` — Payment encoding, nonce generation, signature construction

### Flow

```
fetch("https://api.example.com/data")
  → 402 Payment Required (X-Payment-Required header)
  → Parse requirement (amount, asset, recipient)
  → Check budget (tracker.check(amount, domain))
  → Sign EIP-3009 TransferWithAuthorization
  → Retry with X-Payment header
  → 200 OK (data returned)
  → Record spend in budget tracker
```

---

## @sigloop/defi

DeFi primitive wrappers — Uniswap V3 swaps, Aave V3 lending, and token approvals.

**Location:** `software/lib/defi` (9 source files, 6 test files)

**Dependencies:** `viem`

### Exports

| Function               | Description                                          |
|------------------------|------------------------------------------------------|
| `createDeFiActions`    | Create a chain-aware DeFi action set (resolves router/pool addresses from constants) |
| `encodeSwap`           | Encode a Uniswap V3 exactInputSingle call            |
| `buildApproveCalldata` | Encode an ERC-20 approve call                        |
| `encodeSupply`         | Encode an Aave V3 supply call                        |
| `encodeBorrow`         | Encode an Aave V3 borrow call                        |
| `encodeRepay`          | Encode an Aave V3 repay call                         |

### Types

| Type            | Description                                               |
|-----------------|-----------------------------------------------------------|
| `DeFiActions`   | Object with all encode methods, pre-configured for a chain |
| `DeFiConfig`    | Config: chainId                                            |
| `SwapParams`    | Swap parameters: tokenIn, tokenOut, amountIn, minOut, etc  |
| `SwapResult`    | Encoded call: to, data, value                              |
| `LendingParams` | Lending parameters: asset, amount, onBehalfOf              |
| `LendingResult` | Encoded call: to, data, value                              |

### Internal Modules

- `defi.ts` — `createDeFiActions({ chainId })` factory that resolves protocol addresses
- `swap.ts` — Uniswap V3 Router `exactInputSingle` encoding
- `lending.ts` — Aave V3 Pool `supply`, `borrow`, `repay` encoding
- `staking.ts` — Staking protocol interactions
- `executor.ts` — ERC-7579 executor module interface
- `constants.ts` — Protocol addresses by chainId (Uniswap Router, Aave Pool per chain)

### Usage Pattern

```typescript
const actions = createDeFiActions({ chainId: 8453 })

const swap = actions.encodeSwap({
  tokenIn: "0x...",
  tokenOut: "0x...",
  amountIn: "1000000",
  minAmountOut: "990000",
  recipient: "0x...",
})
// → { to: "0x<uniswap-router>", data: "0x...", value: "0" }
```

---

## @sigloop/wallet-server

Server-side key management using AWS KMS.

**Location:** `software/lib/wallet-server` (9 source files, 4 test files)

**Dependencies:** `viem`, `@aws-sdk/client-kms`

### Exports

| Function        | Description                                               |
|-----------------|-----------------------------------------------------------|
| `createKey`     | Create a new KMS-backed signing key                       |
| `loadKey`       | Load an existing KMS key by key ID                        |
| `createKmsKey`  | Low-level KMS key creation                                |

### Types

| Type              | Description                                             |
|-------------------|---------------------------------------------------------|
| `KmsKey`          | KMS key instance with signing methods                   |
| `KmsConfig`       | AWS region, credentials, key parameters                 |
| `CreateKmsKeyConfig` | Config for KMS key creation                          |

### Internal Modules

- `key.ts` — High-level key creation and loading
- `kms/client.ts` — AWS KMS client initialization
- `kms/public-key.ts` — Public key derivation from KMS asymmetric keys
- `kms/signature.ts` — Sign digests via KMS, normalize to Ethereum-compatible format
- `kms/signer.ts` — Viem `LocalAccount`-compatible signer backed by KMS

### Purpose

In production, private keys should not exist in memory on the backend. This library delegates all signing to AWS KMS, where keys are stored in HSMs and never exported. The `kms/signer.ts` module produces a viem-compatible `LocalAccount` that can be used anywhere a regular private key signer is expected.

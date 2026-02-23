# Types

[<- Back to README](./README.md) | [Previous: DeFi](./defi.md) | [Next: Utils ->](./utils.md)

---

All TypeScript interfaces and types exported by `@sigloop/sdk`. These types are re-exported from the package root.

```typescript
import type {
  SigloopWallet,
  WalletConfig,
  CreateWalletParams,
  Agent,
  AgentConfig,
  SessionKey,
  CreateAgentParams,
  SerializedSessionKey,
  Policy,
  PolicyRule,
  PolicyComposition,
  SpendingLimit,
  ContractAllowlist,
  FunctionAllowlist,
  TimeWindow,
  RateLimit,
  PaymentRequirement,
  X402Config,
  PaymentRecord,
  X402Policy,
  EIP3009Authorization,
  ChainConfig,
  SwapParams,
  LiquidityParams,
  LendingParams,
  StakeParams,
  SwapResult,
  LendingResult,
  StakeResult,
} from "@sigloop/sdk";

import { SupportedChain } from "@sigloop/sdk";
```

---

## Wallet Types

Source: `src/types/wallet.ts`

### `WalletConfig`

Configuration for creating or referencing a smart wallet.

```typescript
interface WalletConfig {
  chainId: SupportedChain;
  rpcUrl?: string;
  bundlerUrl?: string;
  paymasterUrl?: string;
  index?: bigint;
}
```

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `chainId` | `SupportedChain` | Yes | -- | The target chain |
| `rpcUrl` | `string` | No | Chain default | Custom RPC endpoint URL |
| `bundlerUrl` | `string` | No | Chain default | Custom ERC-4337 bundler URL |
| `paymasterUrl` | `string` | No | `undefined` | Paymaster URL for sponsored transactions |
| `index` | `bigint` | No | `0n` | Account index for deterministic address derivation |

---

### `CreateWalletParams`

Parameters passed to `createWallet`.

```typescript
interface CreateWalletParams {
  owner: LocalAccount;
  config: WalletConfig;
}
```

| Field | Type | Description |
|-------|------|-------------|
| `owner` | `LocalAccount` | A viem `LocalAccount` (from `privateKeyToAccount` or WebAuthn) that owns this wallet |
| `config` | `WalletConfig` | Chain and endpoint configuration |

---

### `SigloopWallet`

The smart wallet object returned by `createWallet`.

```typescript
interface SigloopWallet {
  address: Address;
  smartAccount: SmartAccount;
  owner: LocalAccount;
  chainId: SupportedChain;
  entryPointVersion: "0.7";
  deploymentHash?: Hex;
  guardians: Address[];
}
```

| Field | Type | Description |
|-------|------|-------------|
| `address` | `Address` | The smart account's on-chain address |
| `smartAccount` | `SmartAccount` | The viem `SmartAccount` instance (Kernel v0.3.1) |
| `owner` | `LocalAccount` | The owner account |
| `chainId` | `SupportedChain` | The chain this wallet is deployed on |
| `entryPointVersion` | `"0.7"` | Always `"0.7"` (EntryPoint v0.7) |
| `deploymentHash` | `Hex` | Optional transaction hash from deployment |
| `guardians` | `Address[]` | Array of guardian addresses for social recovery |

---

## Agent Types

Source: `src/types/agent.ts`

### `SessionKey`

A session key pair with validity metadata.

```typescript
interface SessionKey {
  privateKey: Hex;
  publicKey: Address;
  account: LocalAccount;
  validAfter: number;
  validUntil: number;
  nonce: bigint;
}
```

| Field | Type | Description |
|-------|------|-------------|
| `privateKey` | `Hex` | The session key's private key |
| `publicKey` | `Address` | The derived Ethereum address |
| `account` | `LocalAccount` | A viem `LocalAccount` derived from the private key |
| `validAfter` | `number` | Unix timestamp (seconds) when the key becomes valid |
| `validUntil` | `number` | Unix timestamp (seconds) when the key expires |
| `nonce` | `bigint` | A unique nonce for this session key |

---

### `SerializedSessionKey`

A JSON-safe representation of a session key. The `account` field is omitted, and `nonce` is stored as a string.

```typescript
interface SerializedSessionKey {
  privateKey: Hex;
  publicKey: Address;
  validAfter: number;
  validUntil: number;
  nonce: string;
}
```

| Field | Type | Description |
|-------|------|-------------|
| `privateKey` | `Hex` | The session key's private key |
| `publicKey` | `Address` | The derived Ethereum address |
| `validAfter` | `number` | Unix timestamp when the key becomes valid |
| `validUntil` | `number` | Unix timestamp when the key expires |
| `nonce` | `string` | The nonce as a decimal string |

---

### `AgentConfig`

Configuration for creating an agent.

```typescript
interface AgentConfig {
  name: string;
  description?: string;
  policy: Policy;
  sessionDurationSeconds?: number;
}
```

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `name` | `string` | Yes | -- | Human-readable agent name |
| `description` | `string` | No | `undefined` | Optional description of the agent's purpose |
| `policy` | `Policy` | Yes | -- | The policy governing agent permissions |
| `sessionDurationSeconds` | `number` | No | `86400` | Session key validity period in seconds |

---

### `CreateAgentParams`

Parameters passed to `createAgent`.

```typescript
interface CreateAgentParams {
  walletAddress: Address;
  owner: LocalAccount;
  config: AgentConfig;
  chainId: SupportedChain;
}
```

| Field | Type | Description |
|-------|------|-------------|
| `walletAddress` | `Address` | The smart wallet address this agent will operate on |
| `owner` | `LocalAccount` | The wallet owner authorizing the agent |
| `config` | `AgentConfig` | Agent configuration |
| `chainId` | `SupportedChain` | The chain the agent operates on |

---

### `Agent`

The full agent object returned by `createAgent`.

```typescript
interface Agent {
  id: Hex;
  name: string;
  description?: string;
  walletAddress: Address;
  sessionKey: SessionKey;
  policy: Policy;
  chainId: SupportedChain;
  createdAt: number;
  expiresAt: number;
  isActive: boolean;
}
```

| Field | Type | Description |
|-------|------|-------------|
| `id` | `Hex` | A unique agent ID derived from `keccak256(walletAddress, sessionKeyAddress, nonce)` |
| `name` | `string` | The agent name |
| `description` | `string` | Optional description |
| `walletAddress` | `Address` | The smart wallet address |
| `sessionKey` | `SessionKey` | The agent's session key |
| `policy` | `Policy` | The policy bound to this agent |
| `chainId` | `SupportedChain` | The chain |
| `createdAt` | `number` | Unix timestamp when the agent was created |
| `expiresAt` | `number` | Unix timestamp when the session key expires |
| `isActive` | `boolean` | Whether the agent is currently active |

---

## Policy Types

Source: `src/types/policy.ts`

### `SpendingLimit`

```typescript
interface SpendingLimit {
  type: "spending";
  maxPerTransaction: bigint;
  maxDaily: bigint;
  maxWeekly: bigint;
  tokenAddress: Address;
}
```

| Field | Type | Description |
|-------|------|-------------|
| `type` | `"spending"` | Discriminant for this rule type |
| `maxPerTransaction` | `bigint` | Maximum amount per single transaction |
| `maxDaily` | `bigint` | Maximum cumulative amount per 24-hour rolling window |
| `maxWeekly` | `bigint` | Maximum cumulative amount per 7-day rolling window |
| `tokenAddress` | `Address` | The token this limit applies to |

---

### `ContractAllowlist`

```typescript
interface ContractAllowlist {
  type: "contract-allowlist";
  addresses: Address[];
}
```

| Field | Type | Description |
|-------|------|-------------|
| `type` | `"contract-allowlist"` | Discriminant |
| `addresses` | `Address[]` | Array of allowed contract addresses |

---

### `FunctionAllowlist`

```typescript
interface FunctionAllowlist {
  type: "function-allowlist";
  contract: Address;
  selectors: Hex[];
}
```

| Field | Type | Description |
|-------|------|-------------|
| `type` | `"function-allowlist"` | Discriminant |
| `contract` | `Address` | The contract these selectors apply to |
| `selectors` | `Hex[]` | Array of 4-byte function selectors |

---

### `TimeWindow`

```typescript
interface TimeWindow {
  type: "time-window";
  validAfter: number;
  validUntil: number;
}
```

| Field | Type | Description |
|-------|------|-------------|
| `type` | `"time-window"` | Discriminant |
| `validAfter` | `number` | Unix timestamp (seconds) when the window opens |
| `validUntil` | `number` | Unix timestamp (seconds) when the window closes |

---

### `RateLimit`

```typescript
interface RateLimit {
  type: "rate-limit";
  maxCalls: number;
  intervalSeconds: number;
}
```

| Field | Type | Description |
|-------|------|-------------|
| `type` | `"rate-limit"` | Discriminant |
| `maxCalls` | `number` | Maximum number of calls in the interval |
| `intervalSeconds` | `number` | The rolling window duration in seconds |

---

### `PolicyRule`

A union type of all possible policy rules.

```typescript
type PolicyRule =
  | SpendingLimit
  | ContractAllowlist
  | FunctionAllowlist
  | TimeWindow
  | RateLimit;
```

---

### `PolicyComposition`

Defines how rules are combined.

```typescript
interface PolicyComposition {
  operator: "AND" | "OR";
  rules: PolicyRule[];
}
```

| Field | Type | Description |
|-------|------|-------------|
| `operator` | `"AND" \| "OR"` | `"AND"` requires all rules to pass; `"OR"` requires any one rule to pass |
| `rules` | `PolicyRule[]` | The rules in the composition |

---

### `Policy`

A complete policy with an ID, rules, composition logic, and ABI-encoded representation.

```typescript
interface Policy {
  id: Hex;
  rules: PolicyRule[];
  composition: PolicyComposition;
  encoded: Hex;
}
```

| Field | Type | Description |
|-------|------|-------------|
| `id` | `Hex` | A keccak256 hash of the encoded rules, used as a unique identifier |
| `rules` | `PolicyRule[]` | The individual rules |
| `composition` | `PolicyComposition` | The composition operator and rules |
| `encoded` | `Hex` | ABI-encoded policy data for on-chain storage |

---

## x402 Types

Source: `src/types/x402.ts`

### `PaymentRequirement`

Describes what a 402-returning server requires for payment. Parsed from the `X-Payment-Requirements` response header.

```typescript
interface PaymentRequirement {
  scheme: string;
  network: string;
  maxAmountRequired: string;
  resource: string;
  description: string;
  mimeType?: string;
  payTo: Address;
  maxTimeoutSeconds: number;
  asset: Address;
  extra?: Record<string, unknown>;
}
```

| Field | Type | Description |
|-------|------|-------------|
| `scheme` | `string` | Payment scheme identifier |
| `network` | `string` | Network identifier (e.g., "base-mainnet") |
| `maxAmountRequired` | `string` | Maximum payment amount as a string |
| `resource` | `string` | The resource being paid for |
| `description` | `string` | Human-readable description of the payment |
| `mimeType` | `string` | Optional MIME type of the resource |
| `payTo` | `Address` | The recipient address for payment |
| `maxTimeoutSeconds` | `number` | Maximum time the authorization should be valid |
| `asset` | `Address` | The ERC-20 token to pay with |
| `extra` | `Record<string, unknown>` | Optional additional metadata |

---

### `X402Config`

Configuration for the x402 payment middleware and client.

```typescript
interface X402Config {
  maxPaymentPerRequest: bigint;
  maxTotalPayment: bigint;
  allowedDomains?: string[];
  allowedAssets?: Address[];
  autoApprove: boolean;
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `maxPaymentPerRequest` | `bigint` | Yes | Maximum payment per individual request |
| `maxTotalPayment` | `bigint` | Yes | Maximum total (daily) payment budget |
| `allowedDomains` | `string[]` | No | If set, only pay these domains |
| `allowedAssets` | `Address[]` | No | If set, only pay with these tokens |
| `autoApprove` | `boolean` | Yes | If `true`, automatically sign and retry 402 requests |

---

### `PaymentRecord`

A record of a completed x402 payment.

```typescript
interface PaymentRecord {
  id: Hex;
  url: string;
  amount: bigint;
  asset: Address;
  payTo: Address;
  timestamp: number;
  txHash?: Hex;
  authorization: Hex;
}
```

| Field | Type | Description |
|-------|------|-------------|
| `id` | `Hex` | Unique payment record ID |
| `url` | `string` | The URL that required payment |
| `amount` | `bigint` | The amount paid |
| `asset` | `Address` | The token used for payment |
| `payTo` | `Address` | The recipient |
| `timestamp` | `number` | Unix timestamp of the payment |
| `txHash` | `Hex` | Optional on-chain transaction hash |
| `authorization` | `Hex` | The EIP-712 signature used for the authorization |

---

### `X402Policy`

Budget policy used by `BudgetTracker`.

```typescript
interface X402Policy {
  maxPerRequest: bigint;
  maxDaily: bigint;
  allowedDomains: string[];
  allowedAssets: Address[];
}
```

| Field | Type | Description |
|-------|------|-------------|
| `maxPerRequest` | `bigint` | Maximum amount per request |
| `maxDaily` | `bigint` | Maximum total amount per 24-hour window |
| `allowedDomains` | `string[]` | Domains allowed for payment (empty = all) |
| `allowedAssets` | `Address[]` | Tokens allowed for payment (empty = all) |

---

### `EIP3009Authorization`

An EIP-3009 `TransferWithAuthorization` data structure.

```typescript
interface EIP3009Authorization {
  from: Address;
  to: Address;
  value: bigint;
  validAfter: bigint;
  validBefore: bigint;
  nonce: Hex;
}
```

| Field | Type | Description |
|-------|------|-------------|
| `from` | `Address` | The token sender |
| `to` | `Address` | The token recipient |
| `value` | `bigint` | The transfer amount |
| `validAfter` | `bigint` | Unix timestamp after which the authorization is valid |
| `validBefore` | `bigint` | Unix timestamp before which the authorization is valid |
| `nonce` | `Hex` | A unique 32-byte nonce |

---

## Chain Types

Source: `src/types/chain.ts`

### `SupportedChain`

An enum of supported chain IDs.

```typescript
enum SupportedChain {
  Base = 8453,
  Arbitrum = 42161,
  BaseSepolia = 84532,
  ArbitrumSepolia = 421614,
}
```

| Member | Value | Description |
|--------|-------|-------------|
| `Base` | `8453` | Base mainnet |
| `Arbitrum` | `42161` | Arbitrum One mainnet |
| `BaseSepolia` | `84532` | Base Sepolia testnet |
| `ArbitrumSepolia` | `421614` | Arbitrum Sepolia testnet |

---

### `ChainConfig`

Full configuration for a supported chain.

```typescript
interface ChainConfig {
  chain: Chain;
  chainId: SupportedChain;
  rpcUrl: string;
  bundlerUrl: string;
  entryPointAddress: Address;
  paymasterUrl?: string;
  explorerUrl: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  averageBlockTime: number;
  averageGasPrice: bigint;
}
```

| Field | Type | Description |
|-------|------|-------------|
| `chain` | `Chain` | A viem `Chain` object (e.g., `base`, `arbitrum`) |
| `chainId` | `SupportedChain` | The chain ID enum value |
| `rpcUrl` | `string` | Default JSON-RPC URL |
| `bundlerUrl` | `string` | Default ERC-4337 bundler URL |
| `entryPointAddress` | `Address` | The EntryPoint v0.7 contract address |
| `paymasterUrl` | `string` | Optional paymaster URL |
| `explorerUrl` | `string` | Block explorer base URL |
| `nativeCurrency` | `object` | Native currency metadata |
| `nativeCurrency.name` | `string` | Currency name (e.g., "Ether") |
| `nativeCurrency.symbol` | `string` | Currency symbol (e.g., "ETH") |
| `nativeCurrency.decimals` | `number` | Decimal places (e.g., 18) |
| `averageBlockTime` | `number` | Average block time in milliseconds |
| `averageGasPrice` | `bigint` | Approximate average gas price in wei |

---

## DeFi Types

Source: `src/types/defi.ts`

### `SwapParams`

```typescript
interface SwapParams {
  chainId: SupportedChain;
  tokenIn: Address;
  tokenOut: Address;
  amountIn: bigint;
  minAmountOut: bigint;
  recipient: Address;
  deadline?: number;
  slippageBps?: number;
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `chainId` | `SupportedChain` | Yes | The chain to swap on |
| `tokenIn` | `Address` | Yes | Input token address |
| `tokenOut` | `Address` | Yes | Output token address |
| `amountIn` | `bigint` | Yes | Input amount |
| `minAmountOut` | `bigint` | Yes | Minimum output amount |
| `recipient` | `Address` | Yes | Output token recipient |
| `deadline` | `number` | No | Transaction deadline timestamp |
| `slippageBps` | `number` | No | Slippage tolerance in basis points |

---

### `LiquidityParams`

```typescript
interface LiquidityParams {
  chainId: SupportedChain;
  tokenA: Address;
  tokenB: Address;
  amountA: bigint;
  amountB: bigint;
  recipient: Address;
  deadline?: number;
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `chainId` | `SupportedChain` | Yes | The chain |
| `tokenA` | `Address` | Yes | First token in the pair |
| `tokenB` | `Address` | Yes | Second token in the pair |
| `amountA` | `bigint` | Yes | Amount of token A |
| `amountB` | `bigint` | Yes | Amount of token B |
| `recipient` | `Address` | Yes | LP token recipient |
| `deadline` | `number` | No | Transaction deadline |

---

### `LendingParams`

```typescript
interface LendingParams {
  chainId: SupportedChain;
  asset: Address;
  amount: bigint;
  onBehalfOf: Address;
  interestRateMode?: number;
}
```

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `chainId` | `SupportedChain` | Yes | -- | The chain |
| `asset` | `Address` | Yes | -- | The lending asset address |
| `amount` | `bigint` | Yes | -- | The amount to supply/borrow/repay |
| `onBehalfOf` | `Address` | Yes | -- | The beneficiary address |
| `interestRateMode` | `number` | No | `2` | `1` = stable rate, `2` = variable rate |

---

### `StakeParams`

```typescript
interface StakeParams {
  chainId: SupportedChain;
  asset: Address;
  amount: bigint;
  validator?: Address;
  recipient: Address;
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `chainId` | `SupportedChain` | Yes | The chain |
| `asset` | `Address` | Yes | The token to stake |
| `amount` | `bigint` | Yes | The amount to stake |
| `validator` | `Address` | No | Staking contract override (uses chain default if omitted) |
| `recipient` | `Address` | Yes | Address to receive the staking position |

---

### `SwapResult`

```typescript
interface SwapResult {
  amountOut: bigint;
  calldata: `0x${string}`;
  to: Address;
  value: bigint;
}
```

| Field | Type | Description |
|-------|------|-------------|
| `amountOut` | `bigint` | Expected minimum output amount |
| `calldata` | `Hex` | ABI-encoded swap calldata |
| `to` | `Address` | The swap router address |
| `value` | `bigint` | Native ETH value to send (0 for ERC-20 inputs) |

---

### `LendingResult`

```typescript
interface LendingResult {
  calldata: `0x${string}`;
  to: Address;
  value: bigint;
}
```

| Field | Type | Description |
|-------|------|-------------|
| `calldata` | `Hex` | ABI-encoded lending calldata |
| `to` | `Address` | The Aave pool address |
| `value` | `bigint` | Always `0n` for lending operations |

---

### `StakeResult`

```typescript
interface StakeResult {
  calldata: `0x${string}`;
  to: Address;
  value: bigint;
}
```

| Field | Type | Description |
|-------|------|-------------|
| `calldata` | `Hex` | ABI-encoded staking calldata |
| `to` | `Address` | The staking contract address |
| `value` | `bigint` | Always `0n` for staking operations |

---

[<- Back to README](./README.md) | [Previous: DeFi](./defi.md) | [Next: Utils ->](./utils.md)

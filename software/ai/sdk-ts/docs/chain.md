# Chain

[<- Back to README](./README.md) | [Previous: x402](./x402.md) | [Next: DeFi ->](./defi.md)

---

The chain module provides configuration for supported EVM chains, optimal chain selection routing, health checks, and cross-chain token bridging.

```typescript
import {
  CHAIN_CONFIGS,
  getChainConfig,
  getChainConfigWithOverrides,
  selectOptimalChain,
  getChainGasPrice,
  isChainHealthy,
  bridgeTokens,
  estimateBridgeFee,
  SupportedChain,
} from "@sigloop/sdk";
```

---

## Chain Configuration

### `CHAIN_CONFIGS`

A constant record mapping each `SupportedChain` to its [`ChainConfig`](./types.md#chainconfig). Contains default RPC URLs, bundler URLs, explorer URLs, and gas parameters for all supported chains.

```typescript
const CHAIN_CONFIGS: Record<SupportedChain, ChainConfig>
```

**Configured chains:**

| Chain | Chain ID | RPC URL | Bundler URL | Explorer |
|-------|----------|---------|-------------|----------|
| Base | 8453 | `https://mainnet.base.org` | `https://bundler.base.org` | `https://basescan.org` |
| Arbitrum | 42161 | `https://arb1.arbitrum.io/rpc` | `https://bundler.arbitrum.io` | `https://arbiscan.io` |
| Base Sepolia | 84532 | `https://sepolia.base.org` | `https://bundler.sepolia.base.org` | `https://sepolia.basescan.org` |
| Arbitrum Sepolia | 421614 | `https://sepolia-rollup.arbitrum.io/rpc` | `https://bundler.sepolia.arbitrum.io` | `https://sepolia.arbiscan.io` |

**Example:**

```typescript
import { CHAIN_CONFIGS, SupportedChain } from "@sigloop/sdk";

const baseConfig = CHAIN_CONFIGS[SupportedChain.Base];
console.log(baseConfig.rpcUrl);           // "https://mainnet.base.org"
console.log(baseConfig.explorerUrl);      // "https://basescan.org"
console.log(baseConfig.averageBlockTime); // 2000 (ms)
console.log(baseConfig.nativeCurrency);   // { name: "Ether", symbol: "ETH", decimals: 18 }
```

---

### `getChainConfig`

Returns the full chain configuration for a supported chain. Throws if the chain ID is not supported.

```typescript
function getChainConfig(chainId: SupportedChain): ChainConfig
```

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `chainId` | [`SupportedChain`](./types.md#supportedchain) | The chain ID enum value |

**Returns:** [`ChainConfig`](./types.md#chainconfig)

**Throws:** `"Unsupported chain: <chainId>"` if the chain is not in `CHAIN_CONFIGS`.

**Example:**

```typescript
import { getChainConfig, SupportedChain } from "@sigloop/sdk";

const config = getChainConfig(SupportedChain.Arbitrum);
console.log(config.chain.name);           // "Arbitrum One"
console.log(config.entryPointAddress);     // "0x0000000071727De22E5E9d8BAf0edAc6f37da032"
console.log(config.averageBlockTime);      // 250 (ms)
```

---

### `getChainConfigWithOverrides`

Returns a chain configuration with optional overrides for RPC, bundler, and paymaster URLs. Non-overridden fields use the defaults from `CHAIN_CONFIGS`.

```typescript
function getChainConfigWithOverrides(
  chainId: SupportedChain,
  overrides?: {
    rpcUrl?: string;
    bundlerUrl?: string;
    paymasterUrl?: string;
  }
): ChainConfig
```

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `chainId` | [`SupportedChain`](./types.md#supportedchain) | The chain ID |
| `overrides` | `object` | Optional URL overrides |
| `overrides.rpcUrl` | `string` | Custom RPC URL |
| `overrides.bundlerUrl` | `string` | Custom bundler URL |
| `overrides.paymasterUrl` | `string` | Custom paymaster URL |

**Returns:** [`ChainConfig`](./types.md#chainconfig)

**Example:**

```typescript
import { getChainConfigWithOverrides, SupportedChain } from "@sigloop/sdk";

const config = getChainConfigWithOverrides(SupportedChain.Base, {
  rpcUrl: "https://my-custom-rpc.com",
  paymasterUrl: "https://my-paymaster.com",
});
// config.rpcUrl = "https://my-custom-rpc.com"
// config.bundlerUrl = "https://bundler.base.org" (default)
// config.paymasterUrl = "https://my-paymaster.com"
```

---

## Chain Router

### `selectOptimalChain`

Selects the optimal chain from a list of candidates by measuring real-time gas prices and latency. Returns the chain with the best score according to the priority strategy.

```typescript
function selectOptimalChain(
  candidates?: SupportedChain[],
  options?: { prioritize?: "cost" | "speed" | "balanced" }
): Promise<ChainConfig>
```

**Parameters:**

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `candidates` | `SupportedChain[]` | `[Base, Arbitrum]` | Chains to evaluate |
| `options.prioritize` | `"cost" \| "speed" \| "balanced"` | `"balanced"` | Scoring strategy |

**Scoring weights:**

| Strategy | Gas Price Weight | Latency Weight |
|----------|-----------------|----------------|
| `"cost"` | 0.9 | 0.1 |
| `"speed"` | 0.1 | 0.9 |
| `"balanced"` | 0.5 | 0.5 |

**Returns:** `Promise<ChainConfig>` -- The configuration for the optimal chain.

**Throws:** `"No reachable chains found"` if all candidate chains fail health checks.

**Example:**

```typescript
import { selectOptimalChain, SupportedChain } from "@sigloop/sdk";

const cheapest = await selectOptimalChain(
  [SupportedChain.Base, SupportedChain.Arbitrum],
  { prioritize: "cost" }
);
console.log("Cheapest chain:", cheapest.chain.name);

const fastest = await selectOptimalChain(undefined, { prioritize: "speed" });
console.log("Fastest chain:", fastest.chain.name);
```

---

### `getChainGasPrice`

Fetches the current gas price from a chain's RPC endpoint.

```typescript
function getChainGasPrice(chainId: SupportedChain): Promise<bigint>
```

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `chainId` | [`SupportedChain`](./types.md#supportedchain) | The chain to query |

**Returns:** `Promise<bigint>` -- The current gas price in wei.

**Example:**

```typescript
import { getChainGasPrice, SupportedChain } from "@sigloop/sdk";
import { formatGwei } from "viem";

const gasPrice = await getChainGasPrice(SupportedChain.Base);
console.log("Base gas price:", formatGwei(gasPrice), "gwei");
```

---

### `isChainHealthy`

Checks if a chain's RPC endpoint is reachable by attempting to fetch the current block number.

```typescript
function isChainHealthy(chainId: SupportedChain): Promise<boolean>
```

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `chainId` | [`SupportedChain`](./types.md#supportedchain) | The chain to check |

**Returns:** `Promise<boolean>` -- `true` if the chain responds to a `getBlockNumber` call.

**Example:**

```typescript
import { isChainHealthy, SupportedChain } from "@sigloop/sdk";

const healthy = await isChainHealthy(SupportedChain.Base);
if (!healthy) {
  console.warn("Base RPC is unreachable, falling back to Arbitrum");
}
```

---

## Cross-Chain Bridging

### `BridgeParams`

```typescript
interface BridgeParams {
  sourceChain: SupportedChain;
  destinationChain: SupportedChain;
  token: Address;
  amount: bigint;
  recipient: Address;
  maxSlippageBps?: number;
}
```

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `sourceChain` | `SupportedChain` | Yes | -- | The chain to bridge from |
| `destinationChain` | `SupportedChain` | Yes | -- | The chain to bridge to |
| `token` | `Address` | Yes | -- | Token address to bridge. Use `0xEeee...eEEeE` for native ETH |
| `amount` | `bigint` | Yes | -- | Amount to bridge |
| `recipient` | `Address` | Yes | -- | Recipient on the destination chain |
| `maxSlippageBps` | `number` | No | `50` | Maximum slippage in basis points (50 = 0.5%) |

### `BridgeResult`

```typescript
interface BridgeResult {
  calldata: Hex;
  to: Address;
  value: bigint;
  estimatedTime: number;
  bridgeData: Hex;
}
```

| Field | Type | Description |
|-------|------|-------------|
| `calldata` | `Hex` | ABI-encoded calldata for the bridge transaction |
| `to` | `Address` | The bridge router contract address |
| `value` | `bigint` | Native ETH value to send with the transaction |
| `estimatedTime` | `number` | Estimated bridge completion time in seconds |
| `bridgeData` | `Hex` | ABI-encoded bridge metadata |

---

### `bridgeTokens`

Builds a cross-chain bridge transaction. Queries the bridge router for fees and constructs the calldata.

```typescript
function bridgeTokens(params: BridgeParams): Promise<BridgeResult>
```

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `params` | `BridgeParams` | Bridge parameters |

**Returns:** `Promise<BridgeResult>`

**Throws:**
- If token or recipient address is invalid
- If amount is negative
- If source and destination chains are the same

**Estimated bridge times:**
- Base <-> Arbitrum (mainnet): ~120 seconds
- Testnet routes: ~300 seconds
- Other routes: ~600 seconds

**Example:**

```typescript
import { bridgeTokens, SupportedChain } from "@sigloop/sdk";

const NATIVE_ETH = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

const result = await bridgeTokens({
  sourceChain: SupportedChain.Base,
  destinationChain: SupportedChain.Arbitrum,
  token: NATIVE_ETH,
  amount: 1000000000000000000n, // 1 ETH
  recipient: "0xMyWallet...",
  maxSlippageBps: 100, // 1%
});

console.log("Bridge to:", result.to);
console.log("Calldata:", result.calldata);
console.log("Value (includes fee):", result.value);
console.log("Estimated time:", result.estimatedTime, "seconds");
```

---

### `estimateBridgeFee`

Estimates the bridge fee for a cross-chain transfer without constructing the full transaction.

```typescript
function estimateBridgeFee(
  params: Omit<BridgeParams, "recipient" | "maxSlippageBps">
): Promise<bigint>
```

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `params.sourceChain` | `SupportedChain` | The source chain |
| `params.destinationChain` | `SupportedChain` | The destination chain |
| `params.token` | `Address` | The token to bridge |
| `params.amount` | `bigint` | The amount to bridge |

**Returns:** `Promise<bigint>` -- The estimated bridge fee. Falls back to `amount / 1000` if the on-chain query fails.

**Example:**

```typescript
import { estimateBridgeFee, SupportedChain } from "@sigloop/sdk";
import { formatEther } from "viem";

const fee = await estimateBridgeFee({
  sourceChain: SupportedChain.Base,
  destinationChain: SupportedChain.Arbitrum,
  token: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
  amount: 1000000000000000000n,
});

console.log("Bridge fee:", formatEther(fee), "ETH");
```

---

[<- Back to README](./README.md) | [Previous: x402](./x402.md) | [Next: DeFi ->](./defi.md)

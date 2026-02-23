# DeFi

[<- Back to README](./README.md) | [Previous: Chain](./chain.md) | [Next: Types ->](./types.md)

---

The DeFi module provides calldata builders for common DeFi operations: token swaps via Uniswap V3, lending/borrowing via Aave V3, and staking. Each function returns encoded calldata and a target address that can be submitted as a UserOperation through the smart account.

```typescript
import {
  // Swap
  executeSwap,
  buildApproveCalldata,
  checkAllowance,
  getSwapRouterAddress,
  // Lending
  supply,
  borrow,
  repay,
  withdraw,
  getUserAccountData,
  getLendingPoolAddress,
  // Staking
  stake,
  unstake,
  claimRewards,
  getStakedBalance,
  getPendingRewards,
} from "@sigloop/sdk";
```

---

## Swap (Uniswap V3)

Swap functions build calldata targeting the Uniswap V3 SwapRouter. The default fee tier is 3000 (0.3%).

**Router addresses:**

| Chain | Address |
|-------|---------|
| Base | `0x2626664c2603336E57B271c5C0b26F421741e481` |
| Arbitrum | `0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45` |
| Base Sepolia | `0x94cC0AaC535CCDB3C01d6787D6413C739ae12bc4` |
| Arbitrum Sepolia | `0x101F443B4d1b059569D643917553c771E1b9663E` |

---

### `executeSwap`

Builds calldata for a Uniswap V3 `exactInputSingle` swap.

```typescript
function executeSwap(params: SwapParams): Promise<SwapResult>
```

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `params` | [`SwapParams`](./types.md#swapparams) | Swap parameters |

`SwapParams` fields:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `chainId` | `SupportedChain` | Yes | The chain to swap on |
| `tokenIn` | `Address` | Yes | Input token address. Use `0xEeee...eEEeE` for native ETH |
| `tokenOut` | `Address` | Yes | Output token address |
| `amountIn` | `bigint` | Yes | Input amount |
| `minAmountOut` | `bigint` | Yes | Minimum output amount (slippage protection) |
| `recipient` | `Address` | Yes | Address to receive output tokens |
| `deadline` | `number` | No | Transaction deadline (unused in current implementation) |
| `slippageBps` | `number` | No | Slippage in basis points (unused in current implementation) |

**Returns:** [`SwapResult`](./types.md#swapresult)

| Field | Type | Description |
|-------|------|-------------|
| `amountOut` | `bigint` | The minimum expected output amount |
| `calldata` | `Hex` | ABI-encoded swap calldata |
| `to` | `Address` | The swap router address |
| `value` | `bigint` | ETH value to send (non-zero only for native ETH input) |

**Example:**

```typescript
import { executeSwap, SupportedChain } from "@sigloop/sdk";

const USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const WETH = "0x4200000000000000000000000000000000000006";

const result = await executeSwap({
  chainId: SupportedChain.Base,
  tokenIn: USDC,
  tokenOut: WETH,
  amountIn: 1000_000000n,         // 1000 USDC
  minAmountOut: 400000000000000n,  // min WETH out
  recipient: "0xMyWallet...",
});

console.log("Send to:", result.to);
console.log("Calldata:", result.calldata);
console.log("Value:", result.value); // 0n for ERC-20 input
```

---

### `buildApproveCalldata`

Builds an ERC-20 `approve` calldata for a token spender (e.g., approve the swap router to spend USDC).

```typescript
function buildApproveCalldata(
  tokenAddress: Address,
  spender: Address,
  amount: bigint
): { calldata: Hex; to: Address }
```

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `tokenAddress` | `Address` | The ERC-20 token to approve |
| `spender` | `Address` | The address being approved to spend |
| `amount` | `bigint` | The amount to approve |

**Returns:** `{ calldata: Hex; to: Address }` -- The approval calldata and the token contract address.

**Example:**

```typescript
import { buildApproveCalldata, getSwapRouterAddress, SupportedChain } from "@sigloop/sdk";

const USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const router = getSwapRouterAddress(SupportedChain.Base);

const approval = buildApproveCalldata(USDC, router, 1000_000000n);
// Submit approval.calldata to approval.to via UserOperation
```

---

### `checkAllowance`

Reads the current ERC-20 allowance from on-chain.

```typescript
function checkAllowance(
  tokenAddress: Address,
  owner: Address,
  spender: Address,
  chainId: SupportedChain
): Promise<bigint>
```

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `tokenAddress` | `Address` | The ERC-20 token |
| `owner` | `Address` | The token owner |
| `spender` | `Address` | The approved spender |
| `chainId` | `SupportedChain` | The chain to query |

**Returns:** `Promise<bigint>` -- The current allowance.

**Example:**

```typescript
import { checkAllowance, getSwapRouterAddress, SupportedChain } from "@sigloop/sdk";

const allowance = await checkAllowance(
  "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  "0xMyWallet...",
  getSwapRouterAddress(SupportedChain.Base),
  SupportedChain.Base
);

if (allowance < 1000_000000n) {
  // Need to approve first
}
```

---

### `getSwapRouterAddress`

Returns the Uniswap V3 SwapRouter address for a chain.

```typescript
function getSwapRouterAddress(chainId: SupportedChain): Address
```

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `chainId` | `SupportedChain` | The chain |

**Returns:** `Address`

**Throws:** If no swap router is configured for the chain.

---

## Lending (Aave V3)

Lending functions build calldata targeting the Aave V3 Pool contract.

**Pool addresses:**

| Chain | Address |
|-------|---------|
| Base | `0xA238Dd80C259a72e81d7e4664a9801593F98d1c5` |
| Arbitrum | `0x794a61358D6845594F94dc1DB02A252b5b4814aD` |
| Base Sepolia | `0x07eA79F68B2B3df564D0A34F8e19D9B1e339814b` |
| Arbitrum Sepolia | `0xBfC91D59fdAA134A4ED45f7B0142c56EDB324T12` |

---

### `supply`

Builds calldata to supply (deposit) an asset into the Aave lending pool.

```typescript
function supply(params: LendingParams): Promise<LendingResult>
```

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `params` | [`LendingParams`](./types.md#lendingparams) | Lending parameters |

`LendingParams` fields:

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `chainId` | `SupportedChain` | Yes | -- | The chain |
| `asset` | `Address` | Yes | -- | The asset to supply |
| `amount` | `bigint` | Yes | -- | The amount to supply |
| `onBehalfOf` | `Address` | Yes | -- | The address that receives the aTokens |
| `interestRateMode` | `number` | No | -- | Not used for supply |

**Returns:** [`LendingResult`](./types.md#lendingresult)

| Field | Type | Description |
|-------|------|-------------|
| `calldata` | `Hex` | ABI-encoded supply calldata |
| `to` | `Address` | The Aave pool address |
| `value` | `bigint` | Always `0n` |

**Example:**

```typescript
import { supply, SupportedChain } from "@sigloop/sdk";

const result = await supply({
  chainId: SupportedChain.Base,
  asset: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  amount: 1000_000000n,
  onBehalfOf: "0xMyWallet...",
});
```

---

### `borrow`

Builds calldata to borrow an asset from the Aave lending pool.

```typescript
function borrow(params: LendingParams): Promise<LendingResult>
```

**Parameters:**

Same as `supply`, with the addition of:

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `interestRateMode` | `number` | No | `2` | Interest rate mode: `1` = stable, `2` = variable |

**Returns:** [`LendingResult`](./types.md#lendingresult)

**Example:**

```typescript
import { borrow, SupportedChain } from "@sigloop/sdk";

const result = await borrow({
  chainId: SupportedChain.Base,
  asset: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  amount: 500_000000n,
  onBehalfOf: "0xMyWallet...",
  interestRateMode: 2, // variable rate
});
```

---

### `repay`

Builds calldata to repay a borrowed asset.

```typescript
function repay(params: LendingParams): Promise<LendingResult>
```

**Parameters:** Same as `borrow`.

**Returns:** [`LendingResult`](./types.md#lendingresult)

**Example:**

```typescript
import { repay, SupportedChain } from "@sigloop/sdk";

const result = await repay({
  chainId: SupportedChain.Base,
  asset: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  amount: 500_000000n,
  onBehalfOf: "0xMyWallet...",
  interestRateMode: 2,
});
```

---

### `withdraw`

Builds calldata to withdraw a supplied asset from the Aave pool. Note that this function takes individual parameters rather than a `LendingParams` object.

```typescript
function withdraw(
  chainId: SupportedChain,
  asset: Address,
  amount: bigint,
  to: Address
): Promise<LendingResult>
```

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `chainId` | `SupportedChain` | The chain |
| `asset` | `Address` | The asset to withdraw |
| `amount` | `bigint` | Amount to withdraw |
| `to` | `Address` | Address to receive the withdrawn tokens |

**Returns:** [`LendingResult`](./types.md#lendingresult)

**Example:**

```typescript
import { withdraw, SupportedChain } from "@sigloop/sdk";

const result = await withdraw(
  SupportedChain.Base,
  "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  1000_000000n,
  "0xMyWallet..."
);
```

---

### `getUserAccountData`

Reads a user's lending account data from the Aave pool on-chain.

```typescript
function getUserAccountData(
  user: Address,
  chainId: SupportedChain
): Promise<UserAccountData>
```

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `user` | `Address` | The user address |
| `chainId` | `SupportedChain` | The chain to query |

**Returns:**

### `UserAccountData`

```typescript
interface UserAccountData {
  totalCollateralBase: bigint;
  totalDebtBase: bigint;
  availableBorrowsBase: bigint;
  currentLiquidationThreshold: bigint;
  ltv: bigint;
  healthFactor: bigint;
}
```

| Field | Type | Description |
|-------|------|-------------|
| `totalCollateralBase` | `bigint` | Total collateral in the base currency (USD, 8 decimals) |
| `totalDebtBase` | `bigint` | Total debt in the base currency |
| `availableBorrowsBase` | `bigint` | Remaining borrow capacity |
| `currentLiquidationThreshold` | `bigint` | The liquidation threshold (in basis points) |
| `ltv` | `bigint` | The loan-to-value ratio (in basis points) |
| `healthFactor` | `bigint` | The health factor (18 decimals; < 1e18 means liquidatable) |

**Example:**

```typescript
import { getUserAccountData, SupportedChain } from "@sigloop/sdk";

const data = await getUserAccountData("0xMyWallet...", SupportedChain.Base);

console.log("Collateral:", data.totalCollateralBase);
console.log("Debt:", data.totalDebtBase);
console.log("Available borrows:", data.availableBorrowsBase);
console.log("Health factor:", data.healthFactor);
```

---

### `getLendingPoolAddress`

Returns the Aave V3 Pool address for a chain.

```typescript
function getLendingPoolAddress(chainId: SupportedChain): Address
```

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `chainId` | `SupportedChain` | The chain |

**Returns:** `Address`

**Throws:** If no lending pool is configured for the chain.

---

## Staking

Staking functions build calldata targeting configurable staking contracts. If no validator address is provided, the chain's default staking contract is used.

---

### `stake`

Builds calldata to stake tokens. Uses `stakeFor` if the recipient differs from the asset address, otherwise uses `stake`.

```typescript
function stake(params: StakeParams): Promise<StakeResult>
```

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `params` | [`StakeParams`](./types.md#stakeparams) | Staking parameters |

`StakeParams` fields:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `chainId` | `SupportedChain` | Yes | The chain |
| `asset` | `Address` | Yes | The token to stake |
| `amount` | `bigint` | Yes | Amount to stake |
| `validator` | `Address` | No | Staking contract override |
| `recipient` | `Address` | Yes | Address to receive staking position |

**Returns:** [`StakeResult`](./types.md#stakeresult)

| Field | Type | Description |
|-------|------|-------------|
| `calldata` | `Hex` | ABI-encoded staking calldata |
| `to` | `Address` | The staking contract address |
| `value` | `bigint` | Always `0n` |

**Example:**

```typescript
import { stake, SupportedChain } from "@sigloop/sdk";

const result = await stake({
  chainId: SupportedChain.Base,
  asset: "0xTokenAddress...",
  amount: 1000000000000000000n,
  recipient: "0xMyWallet...",
});
```

---

### `unstake`

Builds calldata to unstake tokens.

```typescript
function unstake(
  chainId: SupportedChain,
  amount: bigint,
  validator?: Address
): Promise<StakeResult>
```

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `chainId` | `SupportedChain` | Yes | The chain |
| `amount` | `bigint` | Yes | Amount to unstake |
| `validator` | `Address` | No | Staking contract override |

**Returns:** [`StakeResult`](./types.md#stakeresult)

**Example:**

```typescript
import { unstake, SupportedChain } from "@sigloop/sdk";

const result = await unstake(SupportedChain.Base, 500000000000000000n);
```

---

### `claimRewards`

Builds calldata to claim staking rewards. Uses `claimRewardsFor` if a recipient is specified, otherwise uses `claimRewards`.

```typescript
function claimRewards(
  chainId: SupportedChain,
  recipient?: Address,
  validator?: Address
): Promise<StakeResult>
```

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `chainId` | `SupportedChain` | Yes | The chain |
| `recipient` | `Address` | No | Address to receive rewards |
| `validator` | `Address` | No | Staking contract override |

**Returns:** [`StakeResult`](./types.md#stakeresult)

**Example:**

```typescript
import { claimRewards, SupportedChain } from "@sigloop/sdk";

const result = await claimRewards(SupportedChain.Base, "0xMyWallet...");
```

---

### `getStakedBalance`

Reads the staked balance for an account from on-chain.

```typescript
function getStakedBalance(
  account: Address,
  chainId: SupportedChain,
  validator?: Address
): Promise<bigint>
```

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `account` | `Address` | Yes | The account to query |
| `chainId` | `SupportedChain` | Yes | The chain |
| `validator` | `Address` | No | Staking contract override |

**Returns:** `Promise<bigint>` -- The staked balance.

---

### `getPendingRewards`

Reads the pending (unclaimed) staking rewards for an account from on-chain.

```typescript
function getPendingRewards(
  account: Address,
  chainId: SupportedChain,
  validator?: Address
): Promise<bigint>
```

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `account` | `Address` | Yes | The account to query |
| `chainId` | `SupportedChain` | Yes | The chain |
| `validator` | `Address` | No | Staking contract override |

**Returns:** `Promise<bigint>` -- The pending rewards.

**Example:**

```typescript
import { getStakedBalance, getPendingRewards, SupportedChain } from "@sigloop/sdk";

const staked = await getStakedBalance("0xMyWallet...", SupportedChain.Base);
const rewards = await getPendingRewards("0xMyWallet...", SupportedChain.Base);
console.log("Staked:", staked);
console.log("Pending rewards:", rewards);
```

---

[<- Back to README](./README.md) | [Previous: Chain](./chain.md) | [Next: Types ->](./types.md)

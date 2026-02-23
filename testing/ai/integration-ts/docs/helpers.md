# Helpers

[Back to README](./README.md) | [Previous: ABIs](./abis.md) | [Next: x402 Mock](./x402-mock.md)

---

The `src/helpers/` directory contains three modules that provide viem client factories, named test accounts, and x402-related re-exports.

---

## Table of Contents

- [anvil.ts -- Viem Client Factories](#anvilts---viem-client-factories)
- [accounts.ts -- Named Test Accounts](#accountsts---named-test-accounts)
- [x402.ts -- x402 Re-exports](#x402ts---x402-re-exports)

---

## anvil.ts -- Viem Client Factories

**File:** `src/helpers/anvil.ts`

Provides factory functions that create pre-configured viem clients connected to the local Anvil devnet.

### `anvilChain`

A custom chain definition for the local Anvil instance:

```typescript
export const anvilChain = defineChain({
  id: 31337,              // ANVIL_CHAIN_ID
  name: "Anvil",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: ["http://127.0.0.1:8545"] },
  },
});
```

### `getPublicClient(): PublicClient`

Creates a read-only public client for querying chain state.

```typescript
export function getPublicClient(): PublicClient<Transport, Chain> {
  return createPublicClient({
    chain: anvilChain,
    transport: http(ANVIL_RPC_URL),
  });
}
```

**Used for:** `readContract`, `getCode`, `waitForTransactionReceipt`, `simulateContract`, `getBalance`

### `getWalletClient(privateKey): WalletClient`

Creates a wallet client bound to a specific private key for sending transactions.

```typescript
export function getWalletClient(
  privateKey: `0x${string}`
): WalletClient<Transport, Chain, Account> {
  const account = privateKeyToAccount(privateKey);
  return createWalletClient({
    account,
    chain: anvilChain,
    transport: http(ANVIL_RPC_URL),
  });
}
```

**Used for:** `deployContract`, `writeContract`, `signMessage`

### `getTestClient(): TestClient`

Creates a test client with Anvil-specific capabilities (snapshot, revert, mine, etc.).

```typescript
export function getTestClient(): TestClient<"anvil", Transport, Chain> {
  return createTestClient({
    mode: "anvil",
    chain: anvilChain,
    transport: http(ANVIL_RPC_URL),
  });
}
```

**Note:** The test client is exported but not used in any current test suite. It is available for advanced testing scenarios such as snapshot/revert, time manipulation, or impersonation.

### Usage Example

```typescript
import { getPublicClient, getWalletClient, getTestClient } from "../helpers/anvil.js";
import { deployer, agent } from "../helpers/accounts.js";

const publicClient = getPublicClient();
const deployerClient = getWalletClient(deployer.privateKey);
const agentClient = getWalletClient(agent.privateKey);

// Read chain state
const code = await publicClient.getCode({ address: someAddr });

// Send a transaction
const hash = await deployerClient.writeContract({ ... });
await publicClient.waitForTransactionReceipt({ hash });
```

---

## accounts.ts -- Named Test Accounts

**File:** `src/helpers/accounts.ts`

Provides semantic aliases for the first five Anvil pre-funded accounts, mapping them to their roles in the test scenarios.

```typescript
import { ANVIL_ACCOUNTS } from "../config.js";

export const deployer     = ANVIL_ACCOUNTS[0];
export const walletOwner  = ANVIL_ACCOUNTS[1];
export const agent        = ANVIL_ACCOUNTS[2];
export const unauthorized = ANVIL_ACCOUNTS[3];
export const extra        = ANVIL_ACCOUNTS[4];
```

### Account Details

| Name | Index | Address | Role |
|---|---|---|---|
| `deployer` | 0 | `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` | Deploys all contracts |
| `walletOwner` | 1 | `0x70997970C51812dc3A010C7d01b50e0d17dc79C8` | Smart account owner who manages agent policies and budgets |
| `agent` | 2 | `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC` | Authorized AI agent that signs UserOps and makes payments |
| `unauthorized` | 3 | `0x90F79bf6EB2c4f870365E785982E1f101E93b906` | Unregistered agent used in rejection/negative test cases |
| `extra` | 4 | `0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65` | Additional account (not currently used in any test) |

Each account object has the shape:

```typescript
{
  address: "0x..." as const,
  privateKey: "0x..." as const,
}
```

These are the well-known Anvil/Hardhat default accounts. Each is pre-funded with 10,000 ETH.

### Usage Example

```typescript
import { deployer, walletOwner, agent, unauthorized } from "../helpers/accounts.js";
import { getWalletClient } from "../helpers/anvil.js";

const ownerClient = getWalletClient(walletOwner.privateKey);
const agentClient = getWalletClient(agent.privateKey);
```

---

## x402.ts -- x402 Re-exports

**File:** `src/helpers/x402.ts`

A convenience barrel module that re-exports all x402-related functionality so tests can import from a single location.

### Re-exported Items

| Export | Source | Kind |
|---|---|---|
| `createMockX402Server` | `../x402/mock-server.js` | Function |
| `closeMockX402Server` | `../x402/mock-server.js` | Function |
| `x402Fetch` | `../x402/client.js` | Function |
| `PaymentRequirement` | `../x402/types.js` | Type |
| `PaymentHeader` | `../x402/types.js` | Type |
| `PaymentRequirementsResponse` | `../x402/types.js` | Type |
| `X402PaymentResult` | `../x402/client.js` | Type |

### Usage Example

```typescript
// Import everything from the helper barrel
import {
  createMockX402Server,
  closeMockX402Server,
  x402Fetch,
  type PaymentRequirement,
  type X402PaymentResult,
} from "../helpers/x402.js";
```

**Note:** The actual test files (`x402-payment.test.ts`, `full-flow.test.ts`) import directly from `../x402/mock-server.js` and `../x402/client.js` rather than going through this barrel. The barrel exists as a convenience for consumers outside the test directory.

---

[Back to README](./README.md) | [Previous: ABIs](./abis.md) | [Next: x402 Mock](./x402-mock.md)

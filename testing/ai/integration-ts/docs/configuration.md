# Configuration

[Back to README](./README.md) | [Previous: x402 Mock](./x402-mock.md)

---

This document covers the three configuration files that control the test environment: the Anvil connection settings, the Vitest test runner configuration, and the TypeScript compiler options.

---

## Table of Contents

- [config.ts -- Anvil Settings and Accounts](#configts---anvil-settings-and-accounts)
- [vitest.config.ts -- Test Runner Configuration](#vitestconfigts---test-runner-configuration)
- [tsconfig.json -- TypeScript Compiler Options](#tsconfigjson---typescript-compiler-options)
- [package.json -- Scripts and Dependencies](#packagejson---scripts-and-dependencies)

---

## config.ts -- Anvil Settings and Accounts

**File:** `src/config.ts`

Central configuration for the Anvil devnet connection and pre-funded test accounts.

### Constants

#### `ANVIL_RPC_URL`

```typescript
export const ANVIL_RPC_URL = "http://127.0.0.1:8545";
```

The HTTP JSON-RPC endpoint for the local Anvil instance. This is the default port Anvil uses when started with no arguments.

#### `ANVIL_CHAIN_ID`

```typescript
export const ANVIL_CHAIN_ID = 31337;
```

The chain ID for the local Anvil devnet. This matches the default Anvil/Hardhat chain ID.

#### `ANVIL_ACCOUNTS`

```typescript
export const ANVIL_ACCOUNTS = [
  {
    address: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266" as const,
    privateKey: "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80" as const,
  },
  {
    address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8" as const,
    privateKey: "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d" as const,
  },
  {
    address: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC" as const,
    privateKey: "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a" as const,
  },
  {
    address: "0x90F79bf6EB2c4f870365E785982E1f101E93b906" as const,
    privateKey: "0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6" as const,
  },
  {
    address: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65" as const,
    privateKey: "0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a" as const,
  },
] as const;
```

These are the first five of Anvil's ten default accounts. Each is pre-funded with 10,000 ETH. The private keys are well-known and deterministically derived -- they must **never** be used on any live network.

The accounts are assigned semantic roles in `src/helpers/accounts.ts`:

| Index | Role | Used By |
|---|---|---|
| 0 | `deployer` | All suites (deploys contracts) |
| 1 | `walletOwner` | All suites (manages policies/budgets) |
| 2 | `agent` | Most suites (authorized agent) |
| 3 | `unauthorized` | agent-permission, full-flow (negative tests) |
| 4 | `extra` | Not currently used |

---

## vitest.config.ts -- Test Runner Configuration

**File:** `vitest.config.ts`

```typescript
import { defineConfig } from "vitest/config";
export default defineConfig({
  test: {
    globals: true,
    testTimeout: 30000,
    fileParallelism: false,
  },
});
```

### Settings Explained

| Setting | Value | Purpose |
|---|---|---|
| `globals` | `true` | Makes `describe`, `it`, `expect`, `beforeAll`, `afterAll` available globally without explicit imports. However, the test files still import them explicitly from `vitest` for clarity. |
| `testTimeout` | `30000` (30 seconds) | Maximum time a single test case can run before timing out. Contract deployments and multiple sequential transactions can be slow on first run. |
| `fileParallelism` | `false` | **Tests run sequentially, one file at a time.** This is critical because all test suites share a single Anvil instance and deploying contracts to the same chain concurrently would cause nonce conflicts and race conditions. |

### Why Sequential Execution Matters

Each test suite calls `deployAll()` in its `beforeAll`, deploying four contracts. If two suites ran in parallel, they would compete for the same deployer account's nonce, causing transaction failures. Setting `fileParallelism: false` ensures suites execute one after another.

Within each file, individual test cases run sequentially by default in Vitest (the `concurrent` modifier is not used).

---

## tsconfig.json -- TypeScript Compiler Options

**File:** `tsconfig.json`

```json
{
  "compilerOptions": {
    "strict": true,
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "bundler",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "dist",
    "rootDir": "src",
    "declaration": true,
    "resolveJsonModule": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src"]
}
```

### Key Options

| Option | Value | Purpose |
|---|---|---|
| `strict` | `true` | Enables all strict type-checking options |
| `target` | `ES2022` | Output JavaScript targeting ES2022 (supports top-level await, `BigInt`, etc.) |
| `module` | `ES2022` | Use ES module syntax (matches `"type": "module"` in package.json) |
| `moduleResolution` | `bundler` | Resolution strategy compatible with Vite/Vitest bundlers |
| `esModuleInterop` | `true` | Allows default imports from CommonJS modules |
| `skipLibCheck` | `true` | Skips type checking of `.d.ts` files for faster compilation |
| `outDir` | `dist` | Compiled output directory (not used during testing -- Vitest uses tsx) |
| `rootDir` | `src` | Source root for resolving relative paths |
| `declaration` | `true` | Generate `.d.ts` declaration files |
| `resolveJsonModule` | `true` | Allow importing `.json` files (used by deploy.ts to read Foundry artifacts) |

---

## package.json -- Scripts and Dependencies

**File:** `package.json`

```json
{
  "name": "integration-ts",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "packageManager": "pnpm@10.30.1",
  "dependencies": {
    "viem": "^2.46.2"
  },
  "devDependencies": {
    "@types/node": "^25.3.0",
    "tsx": "^4.21.0",
    "typescript": "^5.9.3",
    "vitest": "^4.0.18"
  }
}
```

### Scripts

| Script | Command | Description |
|---|---|---|
| `test` | `vitest run` | Run all tests once and exit |
| `test:watch` | `vitest` | Run tests in watch mode, re-running on file changes |

### Dependencies

| Package | Version | Role |
|---|---|---|
| **viem** | ^2.46.2 | Ethereum client library -- creates clients, encodes/decodes ABI data, signs messages, deploys contracts |

### Dev Dependencies

| Package | Version | Role |
|---|---|---|
| **@types/node** | ^25.3.0 | Node.js type definitions (for `fs`, `http`, `path`, `Buffer`, etc.) |
| **tsx** | ^4.21.0 | TypeScript execution engine used by Vitest to run `.ts` files without a compile step |
| **typescript** | ^5.9.3 | TypeScript compiler for type checking |
| **vitest** | ^4.0.18 | Test runner with built-in assertion library |

### Module System

The `"type": "module"` field means all `.ts` and `.js` files are treated as ES modules. Import paths in the source use the `.js` extension (e.g., `"../config.js"`) following the TypeScript ESM convention where the extension refers to the output file.

---

[Back to README](./README.md) | [Previous: x402 Mock](./x402-mock.md)

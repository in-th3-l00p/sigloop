# Getting Started

[Back to README](./README.md) | [Next: Test Suites](./test-suites.md)

---

## 1. Install Foundry

The tests depend on compiled Solidity artifacts produced by Foundry's `forge` compiler and a running `anvil` devnet.

```bash
# Install Foundry (if not already installed)
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

Verify the installation:

```bash
forge --version
anvil --version
```

---

## 2. Compile the Contracts

The deployment script (`src/deploy.ts`) reads compiled JSON artifacts from `testing/ai/contracts/out/`. Each contract must have a corresponding artifact at:

```
contracts/out/<ContractName>.sol/<ContractName>.json
```

Compile them with:

```bash
cd testing/ai/contracts
forge build
```

This produces artifacts for:
- `AgentPermissionValidator`
- `SpendingLimitHook`
- `X402PaymentPolicy`
- `DeFiExecutor`

---

## 3. Start Anvil

Open a dedicated terminal and start the local devnet:

```bash
anvil
```

Anvil will:
- Listen on `http://127.0.0.1:8545` (the default RPC URL used by the tests)
- Use chain ID `31337`
- Pre-fund 10 accounts with 10,000 ETH each

The tests use the first five of these pre-funded accounts. See [Helpers -- accounts.ts](./helpers.md#accountsts---named-test-accounts) for the full list.

> **Note:** Anvil must remain running for the duration of the test run. The tests do not start or stop Anvil automatically.

---

## 4. Install Dependencies

From the `integration-ts/` directory:

```bash
cd testing/ai/integration-ts
pnpm install
```

This installs:
- `viem` -- Ethereum client library for TypeScript
- `vitest` -- Test runner
- `tsx` -- TypeScript execution without a separate compile step
- `typescript` -- Type checking
- `@types/node` -- Node.js type definitions

---

## 5. Run the Tests

### Run All Tests Once

```bash
pnpm test
```

This executes `vitest run`, which runs every `*.test.ts` file in `src/tests/` sequentially (file parallelism is disabled -- see [Configuration](./configuration.md)).

### Run Tests in Watch Mode

```bash
pnpm test:watch
```

This executes `vitest` (without `run`), which watches for file changes and re-runs affected tests automatically.

### Run a Single Test Suite

```bash
pnpm vitest run src/tests/agent-permission.test.ts
```

### Run with Verbose Output

```bash
pnpm vitest run --reporter=verbose
```

---

## 6. Typical Workflow

```
Terminal 1                          Terminal 2
----------                          ----------
$ anvil                             $ cd testing/ai/contracts
                                    $ forge build
                                    $ cd ../integration-ts
                                    $ pnpm install
                                    $ pnpm test
```

### Expected Output

A successful run produces output similar to:

```
 RUN  v4.0.18 /path/to/integration-ts

 ✓ src/tests/agent-permission.test.ts (6 tests) 1200ms
 ✓ src/tests/spending-limit.test.ts (8 tests) 980ms
 ✓ src/tests/x402-payment.test.ts (9 tests) 1100ms
 ✓ src/tests/defi-executor.test.ts (7 tests) 850ms
 ✓ src/tests/full-flow.test.ts (7 tests) 1500ms

 Test Files  5 passed (5)
      Tests  37 passed (37)
   Start at  ...
   Duration  ...
```

---

## Troubleshooting

| Problem | Solution |
|---|---|
| `Error: ENOENT ... contracts/out/AgentPermissionValidator.sol/AgentPermissionValidator.json` | Run `forge build` in `testing/ai/contracts/` first. |
| `fetch failed` or `ECONNREFUSED 127.0.0.1:8545` | Start `anvil` in a separate terminal. |
| `EADDRINUSE :::18402` or `:::18403` | A previous test run left mock servers running. Kill stale Node processes or wait for ports to free. |
| Timeout errors (> 30 s) | Increase `testTimeout` in `vitest.config.ts` or check Anvil responsiveness. |

---

[Back to README](./README.md) | [Next: Test Suites](./test-suites.md)

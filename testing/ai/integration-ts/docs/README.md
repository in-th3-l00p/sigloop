# Sigloop TypeScript Integration Tests

Technical documentation for the Sigloop smart contract integration test suite. These tests validate the on-chain behavior of Sigloop's ERC-7579 modular smart account modules using TypeScript, [viem](https://viem.sh/), and [Vitest](https://vitest.dev/) against a local [Anvil](https://book.getfoundry.sh/reference/anvil/) devnet.

---

## What These Tests Cover

The integration tests exercise four Solidity contracts that together form the Sigloop agent-permission and payment system:

| Contract | Module Type | Purpose |
|---|---|---|
| **AgentPermissionValidator** | Validator (type 1) | Registers agents with granular policies (allowed targets, selectors, limits, time-bounds) and validates ERC-4337 `PackedUserOperation` signatures against those policies. |
| **SpendingLimitHook** | Hook (type 4) | Enforces per-agent, per-token daily and weekly spending caps via `preCheck` / `postCheck` lifecycle hooks. |
| **X402PaymentPolicy** | Hook (type 4) | Manages per-agent HTTP 402 payment budgets (per-request, daily, total) with domain allow-listing and tracks cumulative spend. |
| **DeFiExecutor** | Executor (type 2) | Encodes and executes DeFi actions (swaps, lending supply/borrow) through the modular account executor interface. |

A **full-flow** integration test ties all four contracts together in a single end-to-end scenario, and a **mock x402 HTTP server** simulates the real-world HTTP 402 payment-required handshake.

---

## Prerequisites

- **Node.js** >= 18
- **pnpm** >= 10 (the project uses `pnpm@10.30.1`)
- **Foundry** toolchain (`forge`, `anvil`) installed and on `$PATH`
- Compiled contract artifacts in `testing/ai/contracts/out/` (produced by `forge build`)

---

## Table of Contents

| Document | Description |
|---|---|
| [Getting Started](./getting-started.md) | Setup Anvil, compile contracts, install dependencies, run tests |
| [Test Suites](./test-suites.md) | Detailed breakdown of every test case across all five suites |
| [Deployment](./deployment.md) | How `deploy.ts` loads Foundry artifacts and deploys contracts |
| [ABIs](./abis.md) | ABI definitions for each contract -- functions, events, structs |
| [Helpers](./helpers.md) | `anvil.ts` clients, `accounts.ts` pre-funded accounts, `x402.ts` re-exports |
| [x402 Mock](./x402-mock.md) | Mock 402 server, x402 fetch wrapper client, type definitions |
| [Configuration](./configuration.md) | `config.ts` Anvil settings, `vitest.config.ts` runner config, `tsconfig.json` |

---

## Project Structure

```
integration-ts/
  src/
    config.ts                          # Anvil RPC URL, chain ID, account list
    deploy.ts                          # Bytecode loader + batch deployer
    abis/
      AgentPermissionValidator.ts      # Validator ABI
      SpendingLimitHook.ts             # Spending hook ABI
      X402PaymentPolicy.ts             # Payment policy ABI
      DeFiExecutor.ts                  # DeFi executor ABI
    helpers/
      anvil.ts                         # viem client factories
      accounts.ts                      # Named account aliases
      x402.ts                          # Re-exports from x402/
    x402/
      types.ts                         # PaymentRequirement, PaymentHeader types
      mock-server.ts                   # Node HTTP server returning 402 responses
      client.ts                        # x402Fetch -- auto-retry with payment header
    tests/
      agent-permission.test.ts         # 6 test cases
      spending-limit.test.ts           # 8 test cases
      x402-payment.test.ts             # 9 test cases
      defi-executor.test.ts            # 7 test cases
      full-flow.test.ts                # 7 test cases
  vitest.config.ts                     # Test runner configuration
  tsconfig.json                        # TypeScript compiler options
  package.json                         # Dependencies and scripts
```

---

## Technology Stack

| Tool | Version | Role |
|---|---|---|
| TypeScript | ^5.9.3 | Language |
| viem | ^2.46.2 | Ethereum client library |
| Vitest | ^4.0.18 | Test runner |
| tsx | ^4.21.0 | TypeScript execution engine |
| Anvil | latest | Local EVM devnet (Foundry) |
| Foundry (forge) | latest | Solidity compiler producing JSON artifacts |

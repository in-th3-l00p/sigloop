# Sigloop Smart Contracts Documentation

Sigloop is an ERC-7579-compliant modular smart-account framework that enables **AI agents to operate on-chain with scoped, revocable permissions**. The contract suite enforces spending limits, validates agent signatures, gates HTTP 402 micro-payments, and executes DeFi actions -- all as discrete modules that can be installed into any ERC-7579 smart account.

---

## ERC-7579 Module Architecture

[ERC-7579](https://eips.ethereum.org/EIPS/eip-7579) defines a standard interface for smart-account modules. Sigloop ships four modules, one for each relevant module type:

| Module Type ID | Type Name | Sigloop Module | Purpose |
|:-:|---|---|---|
| `1` | **Validator** | [`AgentPermissionValidator`](./agent-permission-validator.md) | Validates user-operations signed by delegated AI agents against on-chain policies |
| `2` | **Executor** | [`DeFiExecutor`](./defi-executor.md) | Executes DeFi actions (swap, supply, borrow, repay, stake, unstake) on behalf of an account |
| `4` | **Hook** | [`SpendingLimitHook`](./spending-limit-hook.md) | Enforces per-agent, per-token daily and weekly spending limits |
| `4` | **Hook** | [`X402PaymentPolicy`](./x402-payment-policy.md) | Enforces per-agent HTTP 402 payment budgets with domain allowlists |

### How the modules connect

```
  User / SDK
      |
      v
+-----------------------------+
|   ERC-7579 Smart Account    |
|                             |
|  install(validator, hook,   |
|          executor)          |
+---------+---+---+-----------+
          |   |   |
    +-----+   |   +------+
    v         v          v
Validator   Hook      Executor
(type 1)   (type 4)   (type 2)
    |         |          |
    v         v          v
AgentPerm  Spending   DeFiExec
Validator  LimitHook  / X402
```

1. The **Validator** authenticates the agent's ECDSA signature and checks the operation against the `AgentPolicy`.
2. Before execution, the **Hook** (`SpendingLimitHook` or `X402PaymentPolicy`) runs `preCheck` to enforce budgets and limits.
3. The **Executor** performs the on-chain action (e.g. a token swap via a DEX router).
4. After execution, the Hook's `postCheck` emits an event for off-chain indexing.

---

## Contracts at a Glance

### Interfaces

| File | Description |
|---|---|
| [`IERC7579Module.sol`](./interfaces.md#ierc7579modulesol) | `IValidator`, `IHook`, `IExecutor`, and `PackedUserOperation` struct |
| [`IAgentPermission.sol`](./interfaces.md#iagentpermissionsol) | `AgentPolicy` struct defining scoped agent permissions |

### Libraries

| File | Description |
|---|---|
| [`PolicyLib.sol`](./libraries.md#policylib) | ABI encode/decode helpers and time-window validation for `AgentPolicy` |
| [`SpendingLib.sol`](./libraries.md#spendinglib) | Rolling daily/weekly spending tracker with automatic resets |

### Modules

| File | Description |
|---|---|
| [`AgentPermissionValidator.sol`](./agent-permission-validator.md) | ERC-7579 Validator (type 1) -- ECDSA + policy-gated UserOp validation |
| [`SpendingLimitHook.sol`](./spending-limit-hook.md) | ERC-7579 Hook (type 4) -- per-agent per-token spending limits |
| [`X402PaymentPolicy.sol`](./x402-payment-policy.md) | ERC-7579 Hook (type 4) -- HTTP 402 micro-payment budget enforcement |
| [`DeFiExecutor.sol`](./defi-executor.md) | ERC-7579 Executor (type 2) -- structured DeFi action execution |

---

## Table of Contents

1. **[Getting Started](./getting-started.md)** -- Foundry setup, build, test, deploy
2. **[Interfaces](./interfaces.md)** -- `IERC7579Module`, `IAgentPermission`, `PackedUserOperation`
3. **[Libraries](./libraries.md)** -- `PolicyLib`, `SpendingLib`
4. **[AgentPermissionValidator](./agent-permission-validator.md)** -- Full contract documentation
5. **[SpendingLimitHook](./spending-limit-hook.md)** -- Full contract documentation
6. **[X402PaymentPolicy](./x402-payment-policy.md)** -- Full contract documentation
7. **[DeFiExecutor](./defi-executor.md)** -- Full contract documentation
8. **[Deployment](./deployment.md)** -- `Deploy.s.sol` script, Anvil & testnet deployment
9. **[Testing](./testing.md)** -- Test suite overview, running tests, adding new tests

---

## Repository Layout

```
contracts/
├── foundry.toml
├── script/
│   └── Deploy.s.sol
├── src/
│   ├── interfaces/
│   │   ├── IAgentPermission.sol
│   │   └── IERC7579Module.sol
│   ├── libraries/
│   │   ├── PolicyLib.sol
│   │   └── SpendingLib.sol
│   └── modules/
│       ├── AgentPermissionValidator.sol
│       ├── DeFiExecutor.sol
│       ├── SpendingLimitHook.sol
│       └── X402PaymentPolicy.sol
├── test/
│   ├── AgentPermissionValidator.t.sol
│   ├── DeFiExecutor.t.sol
│   ├── SpendingLimitHook.t.sol
│   └── X402PaymentPolicy.t.sol
└── docs/   <-- you are here
```

---

## License

All contracts are released under the **MIT** license (`SPDX-License-Identifier: MIT`).

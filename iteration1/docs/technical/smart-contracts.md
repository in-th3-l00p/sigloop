# Smart Contracts

Four ERC-7579 modules under `testing/ai/contracts/`. Built with Foundry (Solidity 0.8.23). 27 tests passing.

These modules plug into ZeroDev Kernel smart accounts to enforce on-chain constraints for agent operations, spending limits, payment policies, and DeFi execution.

---

## ERC-7579 Module Types

ERC-7579 defines three module types for modular smart accounts:

| Type        | When it runs                                           | Purpose                              |
|-------------|--------------------------------------------------------|--------------------------------------|
| **Validator** | During UserOperation validation (before execution)   | Verify signatures and permissions    |
| **Hook**      | Before and/or after execution                        | Enforce constraints, track state     |
| **Executor**  | Called by the account to perform actions              | Execute complex multi-step operations |

---

## AgentPermissionValidator

**Type:** Validator Module
**File:** `src/modules/AgentPermissionValidator.sol`
**Tests:** `test/AgentPermissionValidator.t.sol` (7 tests)

### Purpose

Validates that UserOperations signed by agent session keys comply with the policy bound to that agent. This is the on-chain gatekeeper — if the agent tries to call a contract or spend an amount not in its policy, the UserOp is rejected before execution.

### State

```
mapping(address account => mapping(address agent => AgentPolicy)) policies
```

Each smart account can have multiple agents, each with their own policy.

### AgentPolicy Struct

| Field              | Type        | Description                                   |
|--------------------|-------------|-----------------------------------------------|
| `allowedTargets`   | `address[]` | Contracts the agent may call                  |
| `allowedSelectors` | `bytes4[]`  | Function selectors the agent may invoke       |
| `maxAmountPerTx`   | `uint256`   | Maximum value per transaction                 |
| `dailyLimit`       | `uint256`   | Maximum daily aggregate spend                 |
| `weeklyLimit`      | `uint256`   | Maximum weekly aggregate spend                |
| `validAfter`       | `uint48`    | Policy start time (unix timestamp)            |
| `validUntil`       | `uint48`    | Policy expiry time (unix timestamp)           |

### Key Functions

| Function           | Description                                                  |
|--------------------|--------------------------------------------------------------|
| `onInstall(data)`  | Decode and store a policy for an agent on the calling account |
| `onUninstall(data)` | Remove a policy for an agent                                |
| `validateUserOp(userOp, userOpHash)` | Recover signer from signature, look up policy, check target/selector/amount/time constraints. Returns validation data with time range. |

### Validation Logic

1. Recover the signer address from the UserOp signature
2. Look up the policy for `(account, signer)`
3. Verify the call target is in `allowedTargets`
4. Verify the function selector is in `allowedSelectors`
5. Verify the value is within `maxAmountPerTx`
6. Verify aggregate spend is within `dailyLimit` and `weeklyLimit`
7. Return `validAfter` and `validUntil` for the bundler's time check

---

## SpendingLimitHook

**Type:** Hook Module
**File:** `src/modules/SpendingLimitHook.sol`
**Tests:** `test/SpendingLimitHook.t.sol` (7 tests)

### Purpose

Enforces daily and weekly spending caps with automatic period resets. Runs as a pre-execution hook — if the transaction would exceed the limit, the entire UserOp reverts.

### State

```
mapping(address account => SpendingRecord) records
mapping(address account => uint256) dailyLimits
mapping(address account => uint256) weeklyLimits
```

### SpendingRecord Struct

| Field           | Type      | Description                           |
|-----------------|-----------|---------------------------------------|
| `dailySpent`    | `uint256` | Amount spent in current day           |
| `weeklySpent`   | `uint256` | Amount spent in current week          |
| `lastDailyReset`  | `uint48` | Timestamp of last daily reset       |
| `lastWeeklyReset` | `uint48` | Timestamp of last weekly reset      |

### Key Functions

| Function              | Description                                              |
|-----------------------|----------------------------------------------------------|
| `onInstall(data)`     | Decode daily and weekly limits for the calling account   |
| `onUninstall(data)`   | Clear limits and records                                 |
| `preCheck(msgSender, value, msgData)` | Reset periods if needed, check `value` against remaining daily and weekly budget, record spend |
| `postCheck(hookData)` | No-op (all checks happen pre-execution)                  |

### Reset Logic

- Daily reset: if `block.timestamp - lastDailyReset >= 1 days`, reset `dailySpent` to 0
- Weekly reset: if `block.timestamp - lastWeeklyReset >= 7 days`, reset `weeklySpent` to 0

### Events

- `SpendingRecorded(address indexed account, uint256 amount, uint256 dailySpent, uint256 weeklySpent)`

---

## X402PaymentPolicy

**Type:** Hook Module
**File:** `src/modules/X402PaymentPolicy.sol`
**Tests:** `test/X402PaymentPolicy.t.sol` (7 tests)

### Purpose

On-chain enforcement of x402 payment budgets. Tracks per-request caps, daily budgets, total budgets, and domain allowlists. Complements the off-chain budget tracker in `@sigloop/x402`.

### State

```
mapping(address account => X402Budget) budgets
```

### X402Budget Struct

| Field            | Type        | Description                              |
|------------------|-------------|------------------------------------------|
| `maxPerRequest`  | `uint256`   | Maximum payment per single API call      |
| `dailyBudget`    | `uint256`   | Maximum daily spend across all domains   |
| `totalBudget`    | `uint256`   | Lifetime spending cap                    |
| `spent`          | `uint256`   | Total amount spent to date               |
| `dailySpent`     | `uint256`   | Amount spent in current day              |
| `lastReset`      | `uint48`    | Timestamp of last daily reset            |
| `allowedDomains` | `bytes32[]` | Keccak256 hashes of allowed domain strings |

### Key Functions

| Function              | Description                                              |
|-----------------------|----------------------------------------------------------|
| `onInstall(data)`     | Decode budget config and domain allowlist                |
| `onUninstall(data)`   | Clear budget state                                       |
| `preCheck(msgSender, value, msgData)` | Decode payment amount and domain from calldata, verify domain is allowed, verify amount within per-request/daily/total limits, record spend |
| `postCheck(hookData)` | No-op                                                    |

### Events

- `PaymentRecorded(address indexed account, uint256 amount, bytes32 domain)`

---

## DeFiExecutor

**Type:** Executor Module
**File:** `src/modules/DeFiExecutor.sol`
**Tests:** `test/DeFiExecutor.t.sol` (6 tests)

### Purpose

Dispatches DeFi actions (swaps, lending, borrowing, staking) as the smart account. The executor is called by the account itself and forwards calls to protocol contracts.

### ActionType Enum

```solidity
enum ActionType { Swap, Supply, Borrow, Repay, Stake, Unstake }
```

### DeFiAction Struct

| Field        | Type         | Description                              |
|--------------|--------------|------------------------------------------|
| `actionType` | `ActionType` | Which DeFi primitive to execute          |
| `target`     | `address`    | Protocol contract to call                |
| `data`       | `bytes`      | Encoded function call                    |
| `value`      | `uint256`    | ETH value to send                        |

### Key Functions

| Function                     | Description                                        |
|------------------------------|----------------------------------------------------|
| `onInstall(data)`            | Register allowed protocol targets                  |
| `onUninstall(data)`          | Clear allowed targets                              |
| `executeFromExecutor(data)`  | Decode `DeFiAction`, verify target is allowed, execute call via the smart account |

### Execution Flow

1. Agent constructs calldata using `@sigloop/defi` (off-chain encoding)
2. Calldata is wrapped in a `DeFiAction` struct
3. `executeFromExecutor` decodes the action and calls the protocol contract through the smart account
4. The smart account's hooks (SpendingLimitHook, etc.) still run, enforcing limits

---

## Supporting Contracts

### Interfaces

- `src/interfaces/IAgentPermission.sol` — Agent permission policy interface
- `src/interfaces/IERC7579Module.sol` — Standard ERC-7579 module interface (`IValidator`, `IHook`, `IExecutor`)

### Libraries

- `src/libraries/PolicyLib.sol` — ABI encoding and decoding utilities for `AgentPolicy` structs
- `src/libraries/SpendingLib.sol` — Spending limit arithmetic and period reset calculations

---

## Deployment

`script/Deploy.s.sol` deploys all four modules to Anvil (chainId 31337):

```solidity
AgentPermissionValidator validator = new AgentPermissionValidator();
SpendingLimitHook hook = new SpendingLimitHook();
X402PaymentPolicy policy = new X402PaymentPolicy();
DeFiExecutor executor = new DeFiExecutor();
```

The script logs contract addresses for SDK integration. Run via Docker:

```bash
forge script script/Deploy.s.sol --broadcast --rpc-url http://anvil:8545
```

---

## Module Installation Flow

```
1. Create Kernel smart account (ERC-4337)
2. Install AgentPermissionValidator as validator module
   → encodeAgentPolicy() from @sigloop/policy → onInstall(data)
3. Install SpendingLimitHook as hook module
   → encodeSpendingLimit() → onInstall(data)
4. Install X402PaymentPolicy as hook module (optional)
   → encodeX402Budget() from @sigloop/policy → onInstall(data)
5. Install DeFiExecutor as executor module (optional)
   → onInstall(data) with allowed protocol addresses

Now agents can submit UserOperations:
  → Validator checks session key signature + policy
  → Hooks check spending limits + x402 budgets
  → Executor dispatches DeFi actions
```

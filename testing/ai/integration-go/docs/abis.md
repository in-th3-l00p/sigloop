# ABIs

[<< Back to README](README.md) | [Deployment](deployment.md) | [Helpers >>](helpers.md)

Documentation of the ABI (Application Binary Interface) definitions for each Sigloop smart contract module. All ABIs are defined as JSON string constants in the `abis` package.

---

## Package Structure

```
abis/
├── validator.go      # AgentPermissionValidatorABI
├── hook.go           # SpendingLimitHookABI
├── x402policy.go     # X402PaymentPolicyABI
└── executor.go       # DeFiExecutorABI
```

Each file exports a single `const string` containing the full ABI JSON. These are parsed at runtime using `abi.JSON(strings.NewReader(...))` from the go-ethereum library.

---

## AgentPermissionValidator ABI

**File:** `abis/validator.go`
**Constant:** `AgentPermissionValidatorABI`
**Module type:** Validator (type 1)

### Functions

| Function | Mutability | Description |
|----------|------------|-------------|
| `addAgent(address agent, Policy policy)` | nonpayable | Registers an agent with a permission policy |
| `getPolicy(address account, address agent)` | view | Returns the full policy struct for an account/agent pair |
| `removeAgent(address agent)` | nonpayable | Removes an agent's permissions (clears the policy) |
| `validateUserOp(PackedUserOperation userOp, bytes32 userOpHash)` | nonpayable | ERC-4337 UserOp validation; verifies agent signature and policy compliance |
| `isModuleType(uint256 typeId)` | pure | Returns `true` if `typeId == 1` (validator) |
| `onInstall(bytes data)` | nonpayable | ERC-7579 module install callback |
| `onUninstall(bytes data)` | nonpayable | ERC-7579 module uninstall callback |

### Policy Struct

```solidity
struct Policy {
    address[]  allowedTargets;    // Contracts the agent can call
    bytes4[]   allowedSelectors;  // Function selectors the agent can invoke
    uint256    maxAmountPerTx;    // Maximum ETH/token value per transaction
    uint256    dailyLimit;        // Maximum daily aggregate spending
    uint256    weeklyLimit;       // Maximum weekly aggregate spending
    uint48     validAfter;        // Timestamp after which the policy is active (0 = immediate)
    uint48     validUntil;        // Timestamp after which the policy expires (0 = no expiry)
    bool       active;            // Whether the policy is currently active
}
```

### PackedUserOperation Struct

```solidity
struct PackedUserOperation {
    address sender;
    uint256 nonce;
    bytes   initCode;
    bytes   callData;
    bytes32 accountGasLimits;
    uint256 preVerificationGas;
    bytes32 gasFees;
    bytes   paymasterAndData;
    bytes   signature;
}
```

### Usage in Tests

```go
parsedABI, err := abi.JSON(strings.NewReader(abis.AgentPermissionValidatorABI))
input, err := parsedABI.Pack("addAgent", agent.Address, policyStruct)
output, err := parsedABI.Unpack("getPolicy", resultBytes)
```

---

## SpendingLimitHook ABI

**File:** `abis/hook.go`
**Constant:** `SpendingLimitHookABI`
**Module type:** Hook (type 4)

### Functions

| Function | Mutability | Description |
|----------|------------|-------------|
| `setLimits(address agent, address token, uint256 dailyLimit, uint256 weeklyLimit)` | nonpayable | Configures daily and weekly spending limits for an agent/token pair |
| `getSpending(address account, address agent, address token)` | view | Returns the current spending state for an account/agent/token triple |
| `resetSpending(address agent, address token)` | nonpayable | Resets all spending counters to zero |
| `preCheck(address msgSender, uint256, bytes msgData)` | nonpayable | Hook pre-execution check; decodes and records spending |
| `postCheck(bytes hookData)` | nonpayable | Hook post-execution check (no-op in current implementation) |
| `isModuleType(uint256 typeId)` | pure | Returns `true` if `typeId == 4` (hook) |
| `onInstall(bytes data)` | nonpayable | ERC-7579 module install callback |
| `onUninstall(bytes data)` | nonpayable | ERC-7579 module uninstall callback |

### Spending Struct (returned by getSpending)

```solidity
struct Spending {
    uint256 dailySpent;        // Amount spent in the current daily period
    uint256 weeklySpent;       // Amount spent in the current weekly period
    uint256 lastDailyReset;    // Timestamp of last daily counter reset
    uint256 lastWeeklyReset;   // Timestamp of last weekly counter reset
}
```

### Events

| Event | Parameters | Description |
|-------|------------|-------------|
| `SpendingRecorded` | `account` (indexed), `agent` (indexed), `token` (indexed), `amount` | Emitted when spending is recorded through preCheck |

### preCheck Data Encoding

The `msgData` parameter for `preCheck` is ABI-encoded as `(address agent, address token, uint256 amount)`:

```go
preCheckData, err := abi.Arguments{
    {Type: mustType("address")},  // agent
    {Type: mustType("address")},  // token
    {Type: mustType("uint256")},  // amount
}.Pack(agent.Address, token, big.NewInt(500000))
```

---

## X402PaymentPolicy ABI

**File:** `abis/x402policy.go`
**Constant:** `X402PaymentPolicyABI`
**Module type:** Hook (type 4)

### Functions

| Function | Mutability | Description |
|----------|------------|-------------|
| `configureAgent(address agent, Budget budget)` | nonpayable | Sets the x402 payment budget for an agent |
| `getBudget(address account, address agent)` | view | Returns the full budget struct for an account/agent pair |
| `getRemainingBudget(address account, address agent)` | view | Returns `totalBudget - spent` |
| `preCheck(address, uint256, bytes msgData)` | nonpayable | Hook that enforces per-request, daily, and total budget limits |
| `postCheck(bytes hookData)` | nonpayable | Hook post-execution check |
| `isModuleType(uint256 typeId)` | pure | Returns `true` if `typeId == 4` (hook) |
| `onInstall(bytes data)` | nonpayable | ERC-7579 module install callback |
| `onUninstall(bytes data)` | nonpayable | ERC-7579 module uninstall callback |

### Budget Struct

```solidity
struct Budget {
    uint256  maxPerRequest;    // Maximum amount per single API request
    uint256  dailyBudget;      // Maximum daily aggregate spending
    uint256  totalBudget;      // Maximum lifetime budget
    uint256  spent;            // Total amount spent so far
    uint256  dailySpent;       // Amount spent in the current daily period
    uint256  lastReset;        // Timestamp of last daily counter reset
    string[] allowedDomains;   // Whitelisted API domains
}
```

### Events

| Event | Parameters | Description |
|-------|------------|-------------|
| `PaymentRecorded` | `account` (indexed), `agent` (indexed), `amount` | Emitted when a payment is recorded |

### preCheck Data Encoding

The `msgData` for `preCheck` is ABI-encoded as `(address agent, uint256 amount)`:

```go
preCheckData, err := abi.Arguments{
    {Type: mustType("address")},  // agent
    {Type: mustType("uint256")},  // amount
}.Pack(agent.Address, big.NewInt(50000))
```

### Budget Enforcement Logic

The `preCheck` function enforces three limits in order:

1. **Per-request limit** -- Reverts with `"X402: exceeds max per request"` if `amount > maxPerRequest`
2. **Daily budget** -- Reverts with `"X402: daily budget exceeded"` if `dailySpent + amount > dailyBudget`; resets `dailySpent` if the current day differs from `lastReset`
3. **Total budget** -- Reverts with `"X402: total budget exceeded"` if `spent + amount > totalBudget`

---

## DeFiExecutor ABI

**File:** `abis/executor.go`
**Constant:** `DeFiExecutorABI`
**Module type:** Executor (type 2)

### Functions

| Function | Mutability | Description |
|----------|------------|-------------|
| `encodeSwap(address router, address tokenIn, address tokenOut, uint256 amountIn, uint256 minOut)` | pure | Encodes a token swap operation into executor calldata |
| `encodeLending(address pool, address asset, uint256 amount, bool isSupply)` | pure | Encodes a lending supply or withdraw operation |
| `executeFromExecutor(address, bytes data)` | nonpayable | Decodes and executes a DeFi operation; reverts if target is zero or call fails |
| `isModuleType(uint256 typeId)` | pure | Returns `true` if `typeId == 2` (executor) |
| `onInstall(bytes)` | nonpayable | No-op install callback |
| `onUninstall(bytes)` | nonpayable | No-op uninstall callback |

### Execution Model

The executor uses an internal `Operation` struct (encoded within the `data` parameter):

```
Operation {
    uint8   opType;    // 0=Swap, 1=LendingSupply, 2=LendingWithdraw
    address target;    // Router or pool address
    bytes   callData;  // Encoded function call
    uint256 value;     // ETH value to send
}
```

`executeFromExecutor` decodes the operation, validates the target is non-zero, and performs a low-level call. Reverts with `"DeFiExecutor: zero target"` or `"DeFiExecutor: execution failed"` on errors.

---

[<< Deployment](deployment.md) | [Helpers >>](helpers.md)

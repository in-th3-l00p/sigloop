# Deployment

[<< Back to README](README.md) | [Test Suites](test-suites.md) | [ABIs >>](abis.md)

Documentation of the `deploy` package, which handles contract bytecodes and deployment to the local Anvil chain.

---

## Package Overview

The `deploy` package consists of two files:

| File | Purpose |
|------|---------|
| `deploy/bytecodes.go` | Pre-compiled Solidity contract bytecodes as hex string constants |
| `deploy/deploy.go` | `DeployedContracts` struct and `DeployAll()` function |

## DeployedContracts Struct

```go
type DeployedContracts struct {
    Validator    common.Address
    Hook         common.Address
    X402Policy   common.Address
    Executor     common.Address
    ValidatorABI abi.ABI
    HookABI      abi.ABI
    X402ABI      abi.ABI
    ExecutorABI  abi.ABI
}
```

Holds the deployed addresses and parsed ABIs for all four contracts. Used by `full_flow_test.go` to reference contracts by name rather than raw addresses.

## DeployAll Function

```go
func DeployAll(client *ethclient.Client, deployer helpers.Account) (*DeployedContracts, error)
```

Deploys all four Sigloop smart contract modules in sequence and returns a `DeployedContracts` struct.

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `client` | `*ethclient.Client` | Connected Ethereum client (Anvil) |
| `deployer` | `helpers.Account` | Account with ETH to pay gas; typically Anvil account 0 |

### Return Values

| Return | Type | Description |
|--------|------|-------------|
| `contracts` | `*DeployedContracts` | Addresses and ABIs of all deployed contracts |
| `err` | `error` | Non-nil if any step fails |

### Deployment Flow

The function performs these steps sequentially, failing fast if any step errors:

```
1. Parse ABI JSON strings
   ├── abis.AgentPermissionValidatorABI  -->  validatorABI
   ├── abis.SpendingLimitHookABI         -->  hookABI
   ├── abis.X402PaymentPolicyABI         -->  x402ABI
   └── abis.DeFiExecutorABI             -->  executorABI

2. Decode hex bytecodes
   ├── deploy.ValidatorBytecode  -->  validatorBin ([]byte)
   ├── deploy.HookBytecode       -->  hookBin ([]byte)
   ├── deploy.X402PolicyBytecode -->  x402Bin ([]byte)
   └── deploy.ExecutorBytecode   -->  executorBin ([]byte)

3. Deploy each contract via helpers.DeployContract()
   ├── Validator   -->  validatorAddr
   ├── Hook        -->  hookAddr
   ├── X402Policy  -->  x402Addr
   └── Executor    -->  executorAddr

4. Return DeployedContracts struct
```

### Usage Example

```go
client, _ := helpers.NewAnvilClient()
defer client.Close()

owner := helpers.GetAccount(0)
contracts, err := deploy.DeployAll(client, owner)
if err != nil {
    log.Fatal(err)
}

fmt.Println("Validator:", contracts.Validator.Hex())
fmt.Println("Hook:", contracts.Hook.Hex())
fmt.Println("X402Policy:", contracts.X402Policy.Hex())
fmt.Println("Executor:", contracts.Executor.Hex())
```

### Internal Dependencies

`DeployAll` depends on:

- **`abis` package** -- ABI JSON string constants ([ABIs documentation](abis.md))
- **`helpers.DeployContract()`** -- Low-level deployment function ([Helpers documentation](helpers.md#deploycontract))
- **`deploy.bytecodes`** -- Hex-encoded bytecodes (see below)

## Bytecodes

**File:** `deploy/bytecodes.go`

Contains four `const` string declarations with pre-compiled EVM bytecode in hex format:

```go
const (
    ValidatorBytecode = "608060405234801561000f575f80fd..."  // ~5,800 hex chars
    HookBytecode      = "608060405234801561000f575f80fd..."  // ~4,400 hex chars
    X402PolicyBytecode = "608060405234801561000f575f80fd..." // ~5,200 hex chars
    ExecutorBytecode   = "608060405234801561000f575f80fd..." // ~3,000 hex chars
)
```

| Constant | Approximate Size | Contract |
|----------|-----------------|----------|
| `ValidatorBytecode` | ~3.8 KB deployed | AgentPermissionValidator |
| `HookBytecode` | ~2.7 KB deployed | SpendingLimitHook |
| `X402PolicyBytecode` | ~3.3 KB deployed | X402PaymentPolicy |
| `ExecutorBytecode` | ~1.9 KB deployed | DeFiExecutor |

These bytecodes are the output of Solidity compilation (`solc` or `forge build`). They include the creation bytecode (constructor) and the runtime bytecode. None of the contracts require constructor arguments, so the bytecodes are deployed as-is.

### Deployment Mechanics

Each contract is deployed using `helpers.DeployContract()`, which:

1. Hex-decodes the bytecode string to `[]byte`
2. Appends constructor arguments (none for these contracts)
3. Creates a `ContractCreation` transaction with gas limit 8,000,000
4. Signs with EIP-155 signer (chain ID 31337)
5. Sends the transaction and waits for the receipt
6. Returns the `ContractAddress` from the receipt

See [Helpers - DeployContract](helpers.md#deploycontract) for the full implementation details.

---

[<< Test Suites](test-suites.md) | [ABIs >>](abis.md)

# Helpers

[<< Back to README](README.md) | [ABIs](abis.md) | [x402 Mock >>](x402-mock.md)

Documentation of the `helpers` package, which provides Ethereum client connectivity, account management, and transaction utilities used by all test files.

---

## Package Structure

```
helpers/
├── client.go     # Anvil client connection
├── accounts.go   # Account key/address loading
└── tx.go         # Transaction sending, waiting, and contract deployment
```

---

## client.go

### NewAnvilClient

```go
func NewAnvilClient() (*ethclient.Client, error)
```

Creates and returns an `ethclient.Client` connected to the local Anvil node.

**Implementation:**

```go
func NewAnvilClient() (*ethclient.Client, error) {
    return ethclient.Dial(config.AnvilRPC)
}
```

**Details:**
- Connects to `http://127.0.0.1:8545` (defined in `config.AnvilRPC`)
- Returns a standard go-ethereum JSON-RPC client
- Callers are responsible for calling `client.Close()` when done

**Usage:**

```go
client, err := helpers.NewAnvilClient()
if err != nil {
    t.Fatal(err)
}
defer client.Close()
```

---

## accounts.go

### Account Struct

```go
type Account struct {
    Key     *ecdsa.PrivateKey
    Address common.Address
}
```

Holds a parsed ECDSA private key and the derived Ethereum address. Used throughout the test suite to represent signers.

### GetAccount

```go
func GetAccount(index int) Account
```

Loads an Anvil prefunded account by index (0-9).

**Implementation:**

```go
func GetAccount(index int) Account {
    key, _ := crypto.HexToECDSA(config.AnvilPrivateKeys[index])
    addr := crypto.PubkeyToAddress(key.PublicKey)
    return Account{Key: key, Address: addr}
}
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `index` | `int` | Index into `config.AnvilPrivateKeys` (valid: 0-9) |

**Details:**
- Parses the hex private key string from `config.AnvilPrivateKeys[index]`
- Derives the Ethereum address from the public key
- Does not return an error (panics on invalid index); designed for test use only

**Account assignments across tests:**

| Index | Role |
|-------|------|
| 0 | Deployer / Owner (used in all tests) |
| 1 | Agent in `TestAddAgentAndGetPolicy`, `TestSetLimitsAndPreCheck`, `TestFullFlow` |
| 2 | Agent in `TestRemoveAgent` |
| 3 | Agent in `TestResetSpending` |
| 4 | Agent in `TestConfigureAndGetBudget` |
| 5 | Agent in `TestPreCheckRecordsSpending` |
| 6 | Agent in `TestX402MockServerPaymentFlow` |
| 7 | Agent in `TestFullFlowBudgetExhaustion` |

---

## tx.go

### WaitForTx

```go
func WaitForTx(client *ethclient.Client, tx *types.Transaction) (*types.Receipt, error)
```

Retrieves the transaction receipt for a sent transaction.

**Implementation:**

```go
func WaitForTx(client *ethclient.Client, tx *types.Transaction) (*types.Receipt, error) {
    ctx := context.Background()
    receipt, err := client.TransactionReceipt(ctx, tx.Hash())
    if err != nil {
        return nil, err
    }
    return receipt, nil
}
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `client` | `*ethclient.Client` | Ethereum client |
| `tx` | `*types.Transaction` | The sent transaction to wait for |

**Notes:**
- On Anvil, mining is instant (auto-mine mode), so the receipt is available immediately
- Does not poll or retry -- assumes the receipt exists when called

---

### SendTx

```go
func SendTx(
    client *ethclient.Client,
    key *ecdsa.PrivateKey,
    to *common.Address,
    data []byte,
    value *big.Int,
) (*types.Transaction, *types.Receipt, error)
```

Builds, signs, sends, and waits for a transaction. This is the primary transaction helper used across all tests.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `client` | `*ethclient.Client` | Ethereum client |
| `key` | `*ecdsa.PrivateKey` | Signing key |
| `to` | `*common.Address` | Destination contract address |
| `data` | `[]byte` | ABI-encoded calldata |
| `value` | `*big.Int` | ETH value to send (nil defaults to 0) |

**Return Values:**

| Return | Type | Description |
|--------|------|-------------|
| `tx` | `*types.Transaction` | The signed transaction |
| `receipt` | `*types.Receipt` | The mined transaction receipt |
| `err` | `error` | Non-nil if any step fails |

**Flow:**

```
1. Derive sender address from private key
2. Get pending nonce for sender
3. Suggest gas price from the node
4. Default value to 0 if nil
5. Estimate gas (fallback to 8,000,000 on error)
6. Create legacy transaction
7. Sign with EIP-155 signer (chain ID 31337)
8. Send transaction
9. Wait for receipt
10. Return transaction and receipt
```

**Usage:**

```go
input, _ := parsedABI.Pack("addAgent", agent.Address, policy)
tx, receipt, err := helpers.SendTx(client, owner.Key, &contractAddr, input, nil)
```

---

### DeployContract

```go
func DeployContract(
    client *ethclient.Client,
    key *ecdsa.PrivateKey,
    bytecode []byte,
    parsedABI abi.ABI,
    args ...interface{},
) (common.Address, *types.Transaction, error)
```

Deploys a contract to the blockchain.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `client` | `*ethclient.Client` | Ethereum client |
| `key` | `*ecdsa.PrivateKey` | Deployer's signing key |
| `bytecode` | `[]byte` | Compiled contract bytecode |
| `parsedABI` | `abi.ABI` | Parsed ABI (used to encode constructor args) |
| `args` | `...interface{}` | Optional constructor arguments |

**Return Values:**

| Return | Type | Description |
|--------|------|-------------|
| `address` | `common.Address` | Deployed contract address |
| `tx` | `*types.Transaction` | The deployment transaction |
| `err` | `error` | Non-nil if any step fails |

**Flow:**

```
1. Derive deployer address from private key
2. Get pending nonce
3. Suggest gas price
4. If constructor args provided, ABI-encode them and append to bytecode
5. Create contract creation transaction (to=nil, gas=8,000,000)
6. Sign with EIP-155 signer (chain ID 31337)
7. Send transaction
8. Wait for receipt
9. Return receipt.ContractAddress and transaction
```

**Usage:**

```go
bytecode, _ := hex.DecodeString(deploy.ValidatorBytecode)
parsedABI, _ := abi.JSON(strings.NewReader(abis.AgentPermissionValidatorABI))
addr, tx, err := helpers.DeployContract(client, deployer.Key, bytecode, parsedABI)
```

**Constructor arguments example (not used by current contracts, but supported):**

```go
addr, tx, err := helpers.DeployContract(
    client, deployer.Key, bytecode, parsedABI,
    common.HexToAddress("0x1234..."), big.NewInt(1000),
)
```

---

[<< ABIs](abis.md) | [x402 Mock >>](x402-mock.md)

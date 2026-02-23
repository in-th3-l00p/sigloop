# Configuration

[<< Back to README](README.md) | [x402 Mock](x402-mock.md)

Documentation of the `config` package, which defines Anvil connection settings and the prefunded account private keys used by all tests.

---

## Package Structure

```
config/
└── config.go
```

**File:** `config/config.go`

The entire configuration is defined as package-level variables.

## Anvil Connection Settings

```go
var (
    AnvilRPC = "http://127.0.0.1:8545"
    ChainID  = big.NewInt(31337)
)
```

| Variable | Type | Value | Description |
|----------|------|-------|-------------|
| `AnvilRPC` | `string` | `http://127.0.0.1:8545` | JSON-RPC URL for the local Anvil node |
| `ChainID` | `*big.Int` | `31337` | EIP-155 chain ID for Anvil's default configuration |

### Where These Are Used

- **`AnvilRPC`** -- Used by `helpers.NewAnvilClient()` in `helpers/client.go` to establish the Ethereum client connection
- **`ChainID`** -- Used by `helpers.SendTx()` and `helpers.DeployContract()` in `helpers/tx.go` to construct the EIP-155 signer: `types.NewEIP155Signer(config.ChainID)`

## Account Private Keys

```go
var AnvilPrivateKeys = []string{
    "ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",  // [0]
    "59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",  // [1]
    "5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a",  // [2]
    "7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6",  // [3]
    "47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a",  // [4]
    "8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba",  // [5]
    "92db14e403b83dfe3df233f83dfa3a0d7096f21ca9b0d6d6b8d88b2b4ec1564e",  // [6]
    "4bbbf85ce3377467afe5d46f804f221813b2bb87f24d81f60f1fcdbf7cbf4356",  // [7]
    "dbda1821b80551c9d65939329250298aa3472ba22feea921c0cf5d620ea67b97",  // [8]
    "2a871d0798f97d79848a013d4936a73bf4cc922c825d33c1cf7073dff6d409c6",  // [9]
}
```

These are the default Anvil prefunded account private keys. Each account starts with 10,000 ETH on the local test chain.

### Account Index Mapping

| Index | Derived Address | Role in Tests |
|-------|----------------|---------------|
| 0 | `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` | Deployer / Owner |
| 1 | `0x70997970C51812dc3A010C7d01b50e0d17dc79C8` | Agent (permission tests, spending limit, full flow) |
| 2 | `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC` | Agent (remove agent test) |
| 3 | `0x90F79bf6EB2c4f870365E785982E1f101E93b906` | Agent (reset spending test) |
| 4 | `0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65` | Agent (x402 configure budget test) |
| 5 | `0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc` | Agent (x402 preCheck test) |
| 6 | `0x976EA74026E726554dB657fA54763abd0C3a0aa9` | Agent (x402 mock server flow test) |
| 7 | `0x14dC79964da2C08dA15Fd60A5ba272e81B3E5B84` | Agent (full flow budget exhaustion) |
| 8 | `0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f` | Unused (available) |
| 9 | `0xa0Ee7A142d267C1f36714E4a8F75612F20a79720` | Unused (available) |

### Where These Are Used

`AnvilPrivateKeys` is consumed by `helpers.GetAccount(index)` in `helpers/accounts.go`, which parses the hex string into an `ecdsa.PrivateKey` and derives the corresponding Ethereum address:

```go
func GetAccount(index int) Account {
    key, _ := crypto.HexToECDSA(config.AnvilPrivateKeys[index])
    addr := crypto.PubkeyToAddress(key.PublicKey)
    return Account{Key: key, Address: addr}
}
```

## Security Note

These private keys are **Anvil/Hardhat default test keys** and are publicly known. They must never be used on mainnet or any network with real funds. They exist solely for deterministic local testing.

## Customization

To run tests against a different local node:

1. Change `AnvilRPC` to the target RPC URL
2. Update `ChainID` to match the target chain
3. Replace `AnvilPrivateKeys` with funded account keys on the target chain

For example, to use a Hardhat node on a non-default port:

```go
var (
    AnvilRPC = "http://127.0.0.1:8546"
    ChainID  = big.NewInt(31337)
)
```

---

[<< x402 Mock](x402-mock.md) | [Back to README](README.md)

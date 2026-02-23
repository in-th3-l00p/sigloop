# Getting Started

[Back to Overview](./README.md) | [Next: Interfaces](./interfaces.md)

---

## Prerequisites

| Tool | Version | Purpose |
|---|---|---|
| [Foundry](https://getfoundry.sh/) | Latest | Solidity toolchain (`forge`, `cast`, `anvil`) |
| Git | 2.x+ | Dependency management via `forge install` |

Install Foundry:

```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

---

## Project Configuration

The project uses the following `foundry.toml`:

```toml
[profile.default]
src = "src"
out = "out"
libs = ["lib"]
solc_version = "0.8.23"
```

- **Solidity version**: `0.8.23`
- **Source directory**: `src/`
- **Build output**: `out/`
- **Dependencies**: `lib/` (includes `forge-std`)

---

## Clone and Install Dependencies

```bash
# Navigate to the contracts directory
cd testing/ai/contracts

# Install forge-std (if not already present)
forge install foundry-rs/forge-std --no-commit
```

---

## Build

Compile all contracts:

```bash
forge build
```

Expected output:

```
[⠊] Compiling...
[⠒] Compiling 13 files with Solc 0.8.23
[⠢] Solc 0.8.23 finished in ...
Compiler run successful!
```

---

## Test

Run the full test suite:

```bash
forge test
```

Run with verbose output (show individual test results):

```bash
forge test -vv
```

Run with trace output (show full call traces for failing tests):

```bash
forge test -vvvv
```

Run a single test file:

```bash
forge test --match-path test/AgentPermissionValidator.t.sol
```

Run a single test function:

```bash
forge test --match-test testAddAgentAndValidate
```

See [Testing](./testing.md) for a detailed breakdown of every test.

---

## Gas Reports

Generate a gas report for all contracts:

```bash
forge test --gas-report
```

---

## Deployment

### Local (Anvil)

Start a local Ethereum node:

```bash
anvil
```

In a separate terminal, deploy:

```bash
forge script script/Deploy.s.sol:Deploy \
  --rpc-url http://127.0.0.1:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
  --broadcast
```

The `0xac09...` key is Anvil's default account 0.

### Testnet (e.g. Base Sepolia)

```bash
forge script script/Deploy.s.sol:Deploy \
  --rpc-url $BASE_SEPOLIA_RPC_URL \
  --private-key $DEPLOYER_PRIVATE_KEY \
  --broadcast \
  --verify \
  --etherscan-api-key $ETHERSCAN_API_KEY
```

See [Deployment](./deployment.md) for the full walkthrough of `Deploy.s.sol`.

---

## Project Structure Quick Reference

| Path | Description |
|---|---|
| `src/interfaces/` | ERC-7579 and Sigloop interface definitions |
| `src/libraries/` | Reusable library code (`PolicyLib`, `SpendingLib`) |
| `src/modules/` | The four deployable ERC-7579 modules |
| `test/` | Foundry test suites for every module |
| `script/` | Deployment scripts |
| `docs/` | This documentation |

---

[Back to Overview](./README.md) | [Next: Interfaces](./interfaces.md)

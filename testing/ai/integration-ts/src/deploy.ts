import { type WalletClient, type PublicClient, type Transport, type Chain, type Account, type Hex } from "viem";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename_ = fileURLToPath(import.meta.url);
const __dirname_ = dirname(__filename_);
const CONTRACTS_OUT_DIR = join(__dirname_, "../../contracts/out");

function loadBytecode(contractName: string): Hex {
  const artifactPath = join(CONTRACTS_OUT_DIR, `${contractName}.sol`, `${contractName}.json`);
  const artifact = JSON.parse(readFileSync(artifactPath, "utf-8"));
  return artifact.bytecode.object as Hex;
}

async function deployContract(
  walletClient: WalletClient<Transport, Chain, Account>,
  publicClient: PublicClient<Transport, Chain>,
  bytecode: Hex
): Promise<`0x${string}`> {
  const hash = await walletClient.deployContract({
    abi: [],
    bytecode,
  });
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  if (!receipt.contractAddress) {
    throw new Error("Contract deployment failed: no address returned");
  }
  return receipt.contractAddress;
}

export interface DeployedContracts {
  agentPermissionValidator: `0x${string}`;
  spendingLimitHook: `0x${string}`;
  x402PaymentPolicy: `0x${string}`;
  deFiExecutor: `0x${string}`;
}

export async function deployAll(
  walletClient: WalletClient<Transport, Chain, Account>,
  publicClient: PublicClient<Transport, Chain>
): Promise<DeployedContracts> {
  const agentPermissionValidator = await deployContract(
    walletClient,
    publicClient,
    loadBytecode("AgentPermissionValidator")
  );

  const spendingLimitHook = await deployContract(
    walletClient,
    publicClient,
    loadBytecode("SpendingLimitHook")
  );

  const x402PaymentPolicy = await deployContract(
    walletClient,
    publicClient,
    loadBytecode("X402PaymentPolicy")
  );

  const deFiExecutor = await deployContract(
    walletClient,
    publicClient,
    loadBytecode("DeFiExecutor")
  );

  return {
    agentPermissionValidator,
    spendingLimitHook,
    x402PaymentPolicy,
    deFiExecutor,
  };
}

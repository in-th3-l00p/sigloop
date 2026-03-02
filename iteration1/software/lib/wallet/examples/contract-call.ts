import { config } from "dotenv"
config({ path: new URL(".env", import.meta.url) })
import { loadWallet, getGasTokenAddress, getGasTokens, encodeFunctionData } from "../src/index.js"
import { sepolia } from "viem/chains"
import { parseUnits } from "viem"
import type { Abi } from "viem"

const RPC_URL = process.env.ZERODEV_RPC_URL!
const PRIVATE_KEY = process.env.PRIVATE_KEY! as `0x${string}`

const ERC20_ABI: Abi = [
  {
    type: "function",
    name: "transfer",
    inputs: [
      { name: "to", type: "address", internalType: "address" },
      { name: "amount", type: "uint256", internalType: "uint256" },
    ],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "approve",
    inputs: [
      { name: "spender", type: "address", internalType: "address" },
      { name: "amount", type: "uint256", internalType: "uint256" },
    ],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
    stateMutability: "nonpayable",
  },
]

const USDC_SEPOLIA = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238"
const RECIPIENT = "0x1234567890123456789012345678901234567890"

async function main() {
  console.log("--- Gas Token Lookup ---")
  const tokens = getGasTokens(sepolia.id)
  console.log("Available gas tokens on Sepolia:", tokens)

  const usdc = getGasTokenAddress(sepolia.id, "USDC")
  console.log("USDC address:", usdc)

  const wallet = await loadWallet({
    privateKey: PRIVATE_KEY,
    chain: sepolia,
    rpcUrl: RPC_URL,
    sponsorGas: true,
  })

  console.log("\nWallet:", wallet.address)

  console.log("\n--- ERC-20 Transfer ---")
  const txHash = await wallet.sendContractCall({
    address: USDC_SEPOLIA,
    abi: ERC20_ABI,
    functionName: "transfer",
    args: [RECIPIENT, parseUnits("10", 6)],
  })
  console.log("Transfer tx:", txHash)

  console.log("\n--- ERC-20 Approve + Transfer Batch ---")
  const approveData = encodeFunctionData({
    abi: ERC20_ABI,
    functionName: "approve",
    args: ["0x0000000000000000000000000000000000000002", parseUnits("100", 6)],
  })
  const transferData = encodeFunctionData({
    abi: ERC20_ABI,
    functionName: "transfer",
    args: [RECIPIENT, parseUnits("10", 6)],
  })
  const batchHash = await wallet.sendTransactions([
    { to: USDC_SEPOLIA, data: approveData },
    { to: USDC_SEPOLIA, data: transferData },
  ])
  console.log("Approve + Transfer batch tx:", batchHash)
}

main().catch(console.error)

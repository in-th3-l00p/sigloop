import { config } from "dotenv"
config({ path: new URL(".env", import.meta.url) })
import { createWallet, generatePrivateKey } from "../src/index.js"
import { sepolia } from "viem/chains"
import { zeroAddress } from "viem"

const RPC_URL = process.env.ZERODEV_RPC_URL!
const PRIVATE_KEY = (process.env.PRIVATE_KEY ?? generatePrivateKey()) as `0x${string}`

async function main() {
  const wallet = await createWallet({
    privateKey: PRIVATE_KEY,
    chain: sepolia,
    rpcUrl: RPC_URL,
    sponsorGas: true,
  })

  console.log("Wallet:", wallet.address)

  console.log("\n--- Send Single Transaction ---")
  const txHash = await wallet.sendTransaction({
    to: zeroAddress,
    value: 0n,
    data: "0x",
  })
  console.log("Tx hash:", txHash)

  console.log("\n--- Send Batch Transactions ---")
  const batchHash = await wallet.sendTransactions([
    { to: zeroAddress, value: 0n, data: "0x" },
    { to: zeroAddress, value: 0n, data: "0x" },
  ])
  console.log("Batch tx hash:", batchHash)

  console.log("\n--- Send User Operation ---")
  const op = await wallet.sendUserOperation([
    { to: zeroAddress, value: 0n, data: "0x" },
  ])
  console.log("UserOp hash:", op.hash)
  const receipt = await op.wait()
  console.log("Receipt:", receipt.receipt.transactionHash)
}

main().catch(console.error)

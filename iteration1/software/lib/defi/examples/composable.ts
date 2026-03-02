import {
  encodeSwap,
  encodeDeFiAction,
  encodeExecutorSwap,
  buildApproveCalldata,
  UNISWAP_V3_ROUTER,
  AAVE_V3_POOL,
} from "../src/advanced.js"

async function main() {
  const router = UNISWAP_V3_ROUTER[1]
  const pool = AAVE_V3_POOL[1]
  const wallet = "0x1234567890123456789012345678901234567890"
  const usdc = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
  const weth = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"

  console.log("Uniswap V3 Router (mainnet):", router)
  console.log("Aave V3 Pool (mainnet):", pool)

  const swap = encodeSwap({
    router,
    tokenIn: usdc,
    tokenOut: weth,
    amountIn: 1000000n,
    minAmountOut: 0n,
    recipient: wallet,
  })
  console.log("Swap calldata:", swap.data.slice(0, 66) + "...")

  const executorCalldata = encodeExecutorSwap(router, swap.data)
  console.log("Executor calldata:", executorCalldata.slice(0, 66) + "...")

  const action = encodeDeFiAction({
    actionType: "swap",
    target: router,
    data: swap.data,
    value: 0n,
  })
  console.log("DeFi action:", action.slice(0, 66) + "...")

  const approve = buildApproveCalldata(usdc, router, 1000000n)
  console.log("Approve calldata:", approve.data.slice(0, 66) + "...")
}

main().catch(console.error)

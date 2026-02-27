import { createDeFiActions } from "../src/index.js"

async function main() {
  const defi = createDeFiActions({ chainId: 1 })

  const usdc = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
  const weth = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
  const wallet = "0x1234567890123456789012345678901234567890"

  const approve = defi.buildApprove(usdc, defi.encodeSwap({
    tokenIn: usdc,
    tokenOut: weth,
    amountIn: 1000000n,
    minAmountOut: 0n,
    recipient: wallet,
  }).to, 1000000n)
  console.log("Approve tx:", approve)

  const swap = defi.encodeSwap({
    tokenIn: usdc,
    tokenOut: weth,
    amountIn: 1000000n,
    minAmountOut: 500000000000000000n,
    recipient: wallet,
  })
  console.log("Swap tx:", swap)
}

main().catch(console.error)

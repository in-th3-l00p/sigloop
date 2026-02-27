import { createDeFiActions } from "../src/index.js"

async function main() {
  const defi = createDeFiActions({ chainId: 1 })

  const usdc = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
  const wallet = "0x1234567890123456789012345678901234567890"

  const supply = defi.encodeSupply({
    asset: usdc,
    amount: 10000000n,
    onBehalfOf: wallet,
  })
  console.log("Supply tx:", supply)

  const borrow = defi.encodeBorrow({
    asset: usdc,
    amount: 5000000n,
    onBehalfOf: wallet,
  })
  console.log("Borrow tx:", borrow)

  const repay = defi.encodeRepay({
    asset: usdc,
    amount: 5000000n,
    onBehalfOf: wallet,
  })
  console.log("Repay tx:", repay)
}

main().catch(console.error)

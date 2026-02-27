import { privateKeyToAccount, generatePrivateKey } from "viem/accounts"
import {
  signEIP3009Authorization,
  buildPaymentHeader,
  parsePaymentHeader,
  generateNonce,
  USDC_ADDRESSES,
} from "../src/advanced.js"

async function main() {
  const privateKey = generatePrivateKey()
  const account = privateKeyToAccount(privateKey)

  const usdc = USDC_ADDRESSES[8453]
  console.log("USDC (Base):", usdc)

  const nonce = generateNonce()
  console.log("Nonce:", nonce)

  const now = BigInt(Math.floor(Date.now() / 1000))
  const { authorization, signature } = await signEIP3009Authorization(account, {
    token: usdc,
    from: account.address,
    to: "0x2222222222222222222222222222222222222222",
    value: 1000000n,
    validAfter: 0n,
    validBefore: now + 120n,
    nonce,
  })

  console.log("Authorization:", authorization)
  console.log("Signature:", signature)

  const header = buildPaymentHeader(authorization, signature)
  console.log("Payment header:", header.slice(0, 50) + "...")

  const parsed = parsePaymentHeader(header)
  console.log("Parsed from:", parsed.authorization.from)
  console.log("Parsed value:", parsed.authorization.value)
}

main().catch(console.error)

import type { Hex } from "viem"
import { privateKeyToAccount, generatePrivateKey } from "viem/accounts"

export function createSigner(privateKey: Hex) {
  return privateKeyToAccount(privateKey)
}

export function randomSigner() {
  const privateKey = generatePrivateKey()
  return {
    privateKey,
    account: privateKeyToAccount(privateKey),
  }
}

export { generatePrivateKey } from "viem/accounts"

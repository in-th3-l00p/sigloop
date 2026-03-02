import { generatePrivateKey, privateKeyToAccount } from "viem/accounts"
import type { Hex } from "viem"

export type KeysService = {
  generateKeyPair: () => { publicKey: string; privateKey: Hex }
  storeKey: (id: string, publicKey: string, privateKey: Hex) => void
  retrievePublicKey: (id: string) => string | undefined
  retrievePrivateKey: (id: string) => Hex | undefined
  deleteKey: (id: string) => boolean
  hasKey: (id: string) => boolean
}

export function createKeysService(): KeysService {
  const keys = new Map<string, { publicKey: string; encryptedPrivateKey: string }>()

  function encode(key: Hex): string {
    return Buffer.from(key).toString("base64")
  }

  function decode(encoded: string): Hex {
    return Buffer.from(encoded, "base64").toString() as Hex
  }

  return {
    generateKeyPair() {
      const privateKey = generatePrivateKey()
      const account = privateKeyToAccount(privateKey)
      return { publicKey: account.address, privateKey }
    },
    storeKey(id, publicKey, privateKey) {
      keys.set(id, { publicKey, encryptedPrivateKey: encode(privateKey) })
    },
    retrievePublicKey(id) {
      return keys.get(id)?.publicKey
    },
    retrievePrivateKey(id) {
      const entry = keys.get(id)
      if (!entry) return undefined
      return decode(entry.encryptedPrivateKey)
    },
    deleteKey(id) {
      return keys.delete(id)
    },
    hasKey(id) {
      return keys.has(id)
    },
  }
}

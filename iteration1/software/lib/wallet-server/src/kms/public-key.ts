import { keccak256, getAddress, toHex } from "viem"
import type { Address, Hex } from "viem"
import {
  SPKI_SECP256K1_HEADER_LENGTH,
  UNCOMPRESSED_PUBLIC_KEY_PREFIX,
  UNCOMPRESSED_PUBLIC_KEY_LENGTH,
} from "../constants.js"

export function extractUncompressedPublicKey(spki: Uint8Array): Uint8Array {
  const keyStart = SPKI_SECP256K1_HEADER_LENGTH
  const expectedLength = keyStart + UNCOMPRESSED_PUBLIC_KEY_LENGTH

  if (spki.length < expectedLength) {
    throw new Error(
      `Invalid SPKI length: expected at least ${expectedLength} bytes, got ${spki.length}`
    )
  }

  if (spki[keyStart] !== UNCOMPRESSED_PUBLIC_KEY_PREFIX) {
    throw new Error(
      `Invalid public key prefix: expected 0x04, got 0x${spki[keyStart].toString(16)}`
    )
  }

  return spki.slice(keyStart, keyStart + UNCOMPRESSED_PUBLIC_KEY_LENGTH)
}

export function deriveEthAddressFromSpki(
  derPublicKey: Uint8Array,
): { address: Address; publicKey: Hex } {
  const uncompressed = extractUncompressedPublicKey(derPublicKey)
  const publicKeyBytes = uncompressed.slice(1)
  const hash = keccak256(publicKeyBytes)
  const rawAddress = `0x${hash.slice(-40)}` as Address
  const address = getAddress(rawAddress)
  const publicKey = toHex(uncompressed)

  return { address, publicKey }
}

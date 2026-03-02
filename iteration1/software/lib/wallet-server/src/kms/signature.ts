import { recoverAddress, toHex, numberToHex, hexToBytes } from "viem"
import type { Address, Hex } from "viem"
import {
  DER_SEQUENCE_TAG,
  DER_INTEGER_TAG,
  SECP256K1_N,
  SECP256K1_HALF_N,
} from "../constants.js"
import type { DerSignature } from "../types.js"

export function parseDerSignature(der: Uint8Array): DerSignature {
  let offset = 0

  if (der[offset] !== DER_SEQUENCE_TAG) {
    throw new Error(`Expected DER SEQUENCE tag 0x30, got 0x${der[offset].toString(16)}`)
  }
  offset++

  offset++

  if (der[offset] !== DER_INTEGER_TAG) {
    throw new Error(`Expected DER INTEGER tag 0x02, got 0x${der[offset].toString(16)}`)
  }
  offset++

  const rLen = der[offset]
  offset++
  let rBytes = der.slice(offset, offset + rLen)
  offset += rLen

  if (rBytes[0] === 0x00) {
    rBytes = rBytes.slice(1)
  }

  if (der[offset] !== DER_INTEGER_TAG) {
    throw new Error(`Expected DER INTEGER tag 0x02, got 0x${der[offset].toString(16)}`)
  }
  offset++

  const sLen = der[offset]
  offset++
  let sBytes = der.slice(offset, offset + sLen)

  if (sBytes[0] === 0x00) {
    sBytes = sBytes.slice(1)
  }

  const r = bytesToBigInt(rBytes)
  const s = bytesToBigInt(sBytes)

  return { r, s }
}

export function normalizeS(s: bigint): bigint {
  if (s > SECP256K1_HALF_N) {
    return SECP256K1_N - s
  }
  return s
}

export async function toEthSignature(params: {
  derSignature: Uint8Array
  hash: Hex
  address: Address
}): Promise<Hex> {
  const { r, s: rawS } = parseDerSignature(params.derSignature)
  const s = normalizeS(rawS)

  const rHex = padHex(numberToHex(r), 32)
  const sHex = padHex(numberToHex(s), 32)

  const sig27 = concat(rHex, sHex, "0x1b") as Hex
  const recovered27 = await recoverAddress({
    hash: params.hash,
    signature: sig27,
  })

  if (recovered27.toLowerCase() === params.address.toLowerCase()) {
    return sig27
  }

  const sig28 = concat(rHex, sHex, "0x1c") as Hex
  const recovered28 = await recoverAddress({
    hash: params.hash,
    signature: sig28,
  })

  if (recovered28.toLowerCase() === params.address.toLowerCase()) {
    return sig28
  }

  throw new Error(
    `Signature recovery failed: neither v=27 nor v=28 recovered address ${params.address}`
  )
}

function bytesToBigInt(bytes: Uint8Array): bigint {
  let result = 0n
  for (const byte of bytes) {
    result = (result << 8n) | BigInt(byte)
  }
  return result
}

function padHex(hex: Hex, byteLength: number): Hex {
  const stripped = hex.slice(2)
  return `0x${stripped.padStart(byteLength * 2, "0")}` as Hex
}

function concat(...hexes: Hex[]): Hex {
  return `0x${hexes.map((h) => h.slice(2)).join("")}` as Hex
}

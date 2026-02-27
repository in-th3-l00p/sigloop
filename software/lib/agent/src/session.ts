import type { Hex } from "viem"
import { privateKeyToAccount, generatePrivateKey } from "viem/accounts"
import type { SessionKey, SerializedSessionKey } from "./types.js"
import { DEFAULT_SESSION_DURATION } from "./constants.js"

export function generateSessionKey(duration?: number): SessionKey {
  const privateKey = generatePrivateKey()
  const account = privateKeyToAccount(privateKey)
  const expiresAt = Math.floor(Date.now() / 1000) + (duration ?? DEFAULT_SESSION_DURATION)

  return {
    privateKey,
    address: account.address,
    account,
    expiresAt,
  }
}

export function sessionKeyFromPrivateKey(privateKey: Hex, duration?: number): SessionKey {
  const account = privateKeyToAccount(privateKey)
  const expiresAt = Math.floor(Date.now() / 1000) + (duration ?? DEFAULT_SESSION_DURATION)

  return {
    privateKey,
    address: account.address,
    account,
    expiresAt,
  }
}

export function isSessionKeyActive(key: SessionKey): boolean {
  return Math.floor(Date.now() / 1000) < key.expiresAt
}

export function getSessionKeyRemainingTime(key: SessionKey): number {
  return Math.max(0, key.expiresAt - Math.floor(Date.now() / 1000))
}

export function serializeSessionKey(key: SessionKey): string {
  const serialized: SerializedSessionKey = {
    privateKey: key.privateKey,
    address: key.address,
    expiresAt: key.expiresAt,
  }
  return JSON.stringify(serialized)
}

export function deserializeSessionKey(data: string): SessionKey {
  const parsed: SerializedSessionKey = JSON.parse(data)
  const account = privateKeyToAccount(parsed.privateKey)

  return {
    privateKey: parsed.privateKey,
    address: parsed.address,
    account,
    expiresAt: parsed.expiresAt,
  }
}

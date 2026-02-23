import {
  type Hex,
  type Address,
  type LocalAccount,
} from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import type { SessionKey, SerializedSessionKey } from "../types/agent.js";

export function generateSessionKey(
  durationSeconds: number = 86400,
  nonce?: bigint
): SessionKey {
  const privateKey = generatePrivateKey();
  const account = privateKeyToAccount(privateKey);

  const now = Math.floor(Date.now() / 1000);

  return {
    privateKey,
    publicKey: account.address,
    account,
    validAfter: now,
    validUntil: now + durationSeconds,
    nonce: nonce ?? BigInt(now),
  };
}

export function sessionKeyFromPrivateKey(
  privateKey: Hex,
  validAfter: number,
  validUntil: number,
  nonce: bigint
): SessionKey {
  const account = privateKeyToAccount(privateKey);

  return {
    privateKey,
    publicKey: account.address,
    account,
    validAfter,
    validUntil,
    nonce,
  };
}

export function serializeSessionKey(sessionKey: SessionKey): SerializedSessionKey {
  return {
    privateKey: sessionKey.privateKey,
    publicKey: sessionKey.publicKey,
    validAfter: sessionKey.validAfter,
    validUntil: sessionKey.validUntil,
    nonce: sessionKey.nonce.toString(),
  };
}

export function deserializeSessionKey(serialized: SerializedSessionKey): SessionKey {
  const account = privateKeyToAccount(serialized.privateKey);

  return {
    privateKey: serialized.privateKey,
    publicKey: serialized.publicKey,
    account,
    validAfter: serialized.validAfter,
    validUntil: serialized.validUntil,
    nonce: BigInt(serialized.nonce),
  };
}

export function isSessionKeyExpired(sessionKey: SessionKey): boolean {
  const now = Math.floor(Date.now() / 1000);
  return now >= sessionKey.validUntil;
}

export function isSessionKeyActive(sessionKey: SessionKey): boolean {
  const now = Math.floor(Date.now() / 1000);
  return now >= sessionKey.validAfter && now < sessionKey.validUntil;
}

export function getSessionKeyRemainingTime(sessionKey: SessionKey): number {
  const now = Math.floor(Date.now() / 1000);
  if (now >= sessionKey.validUntil) {
    return 0;
  }
  return sessionKey.validUntil - now;
}

import { randomBytes } from "node:crypto"
import type { Address, Hex } from "viem"
import { toHex } from "viem"
import type { EIP3009AuthorizationParams } from "./types.js"
import { EIP_3009_TYPES, USDC_ADDRESSES } from "./constants.js"

export async function signEIP3009Authorization(
  signer: any,
  params: EIP3009AuthorizationParams,
): Promise<{ authorization: EIP3009AuthorizationParams; signature: Hex }> {
  const domain = {
    name: "USD Coin",
    version: "2",
    chainId: undefined as number | undefined,
    verifyingContract: params.token,
  }

  const signature = await signer.signTypedData({
    domain,
    types: EIP_3009_TYPES,
    primaryType: "TransferWithAuthorization",
    message: {
      from: params.from,
      to: params.to,
      value: params.value,
      validAfter: params.validAfter,
      validBefore: params.validBefore,
      nonce: params.nonce,
    },
  })

  return { authorization: params, signature }
}

export function buildPaymentHeader(
  authorization: EIP3009AuthorizationParams,
  signature: Hex,
): string {
  const payload = {
    authorization: {
      from: authorization.from,
      to: authorization.to,
      value: authorization.value.toString(),
      validAfter: authorization.validAfter.toString(),
      validBefore: authorization.validBefore.toString(),
      nonce: authorization.nonce,
    },
    signature,
  }

  return btoa(JSON.stringify(payload))
}

export function parsePaymentHeader(header: string): {
  authorization: EIP3009AuthorizationParams
  signature: Hex
} {
  const decoded = JSON.parse(atob(header))

  return {
    authorization: {
      token: "0x0000000000000000000000000000000000000000" as Address,
      from: decoded.authorization.from as Address,
      to: decoded.authorization.to as Address,
      value: BigInt(decoded.authorization.value),
      validAfter: BigInt(decoded.authorization.validAfter),
      validBefore: BigInt(decoded.authorization.validBefore),
      nonce: decoded.authorization.nonce as Hex,
    },
    signature: decoded.signature as Hex,
  }
}

export function generateNonce(): Hex {
  return toHex(randomBytes(32))
}

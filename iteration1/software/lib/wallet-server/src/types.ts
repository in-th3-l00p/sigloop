import type { Address, Hex, LocalAccount } from "viem"
import type { KMSClient } from "@aws-sdk/client-kms"

export type KmsConfig = {
  kmsClient: KMSClient
  keyId: string
}

export type CreateKmsKeyConfig = {
  kmsClient: KMSClient
  alias?: string
  description?: string
  tags?: Record<string, string>
  policy?: string
  multiRegion?: boolean
}

export type KmsSignerResult = {
  signer: LocalAccount
  address: Address
  publicKey: Hex
}

export type KmsKey = {
  keyId: string
  address: Address
  publicKey: Hex
  signer: LocalAccount
}

export type DerSignature = {
  r: bigint
  s: bigint
}

import type { Address, Chain, Hex } from "viem"
import type { KMSClient } from "@aws-sdk/client-kms"

export type EntryPointVersion = "0.6" | "0.7"

export type KernelVersion =
  | "0.2.2" | "0.2.3" | "0.2.4"
  | "0.3.0" | "0.3.1" | "0.3.2" | "0.3.3"

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

export type KmsWalletConfig = {
  kmsClient: KMSClient
  keyId: string
  chain: Chain
  rpcUrl: string
  publicRpcUrl?: string
  index?: bigint
  sponsorGas?: boolean
  gasToken?: Address
  entryPointVersion?: EntryPointVersion
  kernelVersion?: KernelVersion
}

export type CreateKmsWalletConfig = {
  kmsClient: KMSClient
  chain: Chain
  rpcUrl: string
  publicRpcUrl?: string
  index?: bigint
  sponsorGas?: boolean
  gasToken?: Address
  entryPointVersion?: EntryPointVersion
  kernelVersion?: KernelVersion
  alias?: string
  description?: string
  tags?: Record<string, string>
  policy?: string
  multiRegion?: boolean
}

export type KmsSignerResult = {
  signer: any
  address: Address
  publicKey: Hex
}

export type DerSignature = {
  r: bigint
  s: bigint
}

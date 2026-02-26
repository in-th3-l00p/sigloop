import type { Address, Chain, Hex } from "viem"

export type EntryPointVersion = "0.6" | "0.7"

export type KernelVersion =
  | "0.2.2" | "0.2.3" | "0.2.4"
  | "0.3.0" | "0.3.1" | "0.3.2" | "0.3.3"

export type TransactionRequest = {
  to: Address
  value?: bigint
  data?: Hex
}

export type ValidatorConfig = {
  signer: any
  entryPointVersion?: EntryPointVersion
  kernelVersion?: KernelVersion
  validatorAddress?: Address
}

export type AccountConfig = {
  validator: any
  index?: bigint
  entryPointVersion?: EntryPointVersion
  kernelVersion?: KernelVersion
  address?: Address
}

export type PaymasterConfig = {
  chain: Chain
  rpcUrl: string
}

export type ClientConfig = {
  account: any
  chain: Chain
  rpcUrl: string
  publicClient?: any
  paymaster?: PaymasterOptions
}

export type PaymasterOptions =
  | { type: "sponsor"; paymasterClient: any }
  | { type: "erc20"; paymasterClient: any; gasToken: Address }
  | { type: "none" }

export type WalletConfig = {
  privateKey: Hex
  chain: Chain
  rpcUrl: string
  publicRpcUrl?: string
  index?: bigint
  sponsorGas?: boolean
  gasToken?: Address
  entryPointVersion?: EntryPointVersion
  kernelVersion?: KernelVersion
}

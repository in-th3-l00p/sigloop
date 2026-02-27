import { createPublicClient, http } from "viem"
import type { Hex, TypedDataDefinition, Abi } from "viem"
import {
  createEcdsaValidator,
  createSmartAccount,
  createPaymaster,
  createAccountClient,
  sendTransaction,
  sendTransactions,
  sendContractCall,
  signMessage,
  signTypedData,
  verifySignature,
} from "@sigloop/wallet/advanced"
import type { TransactionRequest, PaymasterOptions } from "@sigloop/wallet/advanced"
import { createKmsKey } from "./kms/client.js"
import { createKmsSigner } from "./kms/signer.js"
import type { KmsWalletConfig, CreateKmsWalletConfig } from "./types.js"

export type KmsWallet = {
  address: `0x${string}`
  keyId: string
  publicKey: Hex

  sendTransaction: (tx: TransactionRequest) => Promise<Hex>
  sendTransactions: (txs: TransactionRequest[]) => Promise<Hex>
  sendContractCall: (params: {
    address: `0x${string}`
    abi: Abi
    functionName: string
    args?: unknown[]
    value?: bigint
  }) => Promise<Hex>

  signMessage: (message: string) => Promise<Hex>
  signTypedData: (typedData: TypedDataDefinition) => Promise<Hex>
  verifySignature: (message: string, signature: Hex) => Promise<boolean>
}

export async function createKmsWallet(
  config: CreateKmsWalletConfig,
): Promise<KmsWallet> {
  const keyId = await createKmsKey({
    kmsClient: config.kmsClient,
    alias: config.alias,
    description: config.description,
    tags: config.tags,
    policy: config.policy,
    multiRegion: config.multiRegion,
  })

  return buildKmsWallet(keyId, config)
}

export async function loadKmsWallet(config: KmsWalletConfig): Promise<KmsWallet> {
  return buildKmsWallet(config.keyId, config)
}

async function buildKmsWallet(
  keyId: string,
  config: KmsWalletConfig | CreateKmsWalletConfig,
): Promise<KmsWallet> {
  const { signer, address, publicKey } = await createKmsSigner({
    kmsClient: config.kmsClient,
    keyId,
  })

  const publicClient = createPublicClient({
    chain: config.chain,
    transport: http(config.publicRpcUrl ?? config.rpcUrl),
  })

  const validator = await createEcdsaValidator(publicClient, {
    signer,
    entryPointVersion: config.entryPointVersion,
    kernelVersion: config.kernelVersion,
  })

  const account = await createSmartAccount(publicClient, {
    validator,
    index: config.index,
    entryPointVersion: config.entryPointVersion,
    kernelVersion: config.kernelVersion,
  })

  let paymasterOptions: PaymasterOptions = { type: "none" }

  if (config.sponsorGas || config.gasToken) {
    const paymasterClient = createPaymaster({
      chain: config.chain,
      rpcUrl: config.rpcUrl,
    })

    if (config.gasToken) {
      paymasterOptions = {
        type: "erc20",
        paymasterClient,
        gasToken: config.gasToken,
      }
    } else {
      paymasterOptions = {
        type: "sponsor",
        paymasterClient,
      }
    }
  }

  const client = createAccountClient({
    account,
    chain: config.chain,
    rpcUrl: config.rpcUrl,
    publicClient,
    paymaster: paymasterOptions,
  })

  return {
    address: account.address,
    keyId,
    publicKey,

    sendTransaction: (tx) => sendTransaction(client, tx),
    sendTransactions: (txs) => sendTransactions(client, txs),
    sendContractCall: (params) => sendContractCall(client, params),

    signMessage: (message) => signMessage(client, message),
    signTypedData: (typedData) => signTypedData(client, typedData),
    verifySignature: (message, signature) =>
      verifySignature(publicClient, {
        signer: account.address,
        message,
        signature,
      }),
  }
}

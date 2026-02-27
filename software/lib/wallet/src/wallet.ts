import { createPublicClient, http } from "viem"
import type { Hex, TypedDataDefinition, Abi } from "viem"
import { createSigner, randomSigner } from "./signer.js"
import { createEcdsaValidator } from "./validator.js"
import { createSmartAccount } from "./account.js"
import { createPaymaster } from "./paymaster.js"
import { createAccountClient } from "./client.js"
import { sendTransaction, sendTransactions, sendContractCall } from "./transactions.js"
import { signMessage, signTypedData, verifySignature } from "./signing.js"
import type {
  CreateWalletConfig,
  LoadWalletConfig,
  WalletConfig,
  TransactionRequest,
  PaymasterOptions,
} from "./types.js"

export type Wallet = {
  address: `0x${string}`
  privateKey: Hex

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

export async function createWallet(config: CreateWalletConfig): Promise<Wallet> {
  const { privateKey } = randomSigner()
  return buildWallet(privateKey, config)
}

export async function loadWallet(config: LoadWalletConfig): Promise<Wallet> {
  return buildWallet(config.privateKey, config)
}

export async function buildWallet(
  privateKey: Hex,
  config: CreateWalletConfig | LoadWalletConfig | WalletConfig,
): Promise<Wallet> {
  const fullConfig = config as WalletConfig
  const signer = createSigner(privateKey)

  const publicClient = createPublicClient({
    chain: config.chain,
    transport: http(fullConfig.publicRpcUrl ?? config.rpcUrl),
  })

  const validator = await createEcdsaValidator(publicClient, {
    signer,
    entryPointVersion: fullConfig.entryPointVersion,
    kernelVersion: fullConfig.kernelVersion,
  })

  const account = await createSmartAccount(publicClient, {
    validator,
    index: fullConfig.index,
    entryPointVersion: fullConfig.entryPointVersion,
    kernelVersion: fullConfig.kernelVersion,
  })

  let paymasterClient: any = null
  let paymasterOptions: PaymasterOptions = { type: "none" }

  if (config.sponsorGas || config.gasToken) {
    paymasterClient = createPaymaster({
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
    privateKey,

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

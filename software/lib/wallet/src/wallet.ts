import { createPublicClient, http } from "viem"
import type { Hex, TypedDataDefinition, Abi } from "viem"
import { createSigner } from "./signer.js"
import { createEcdsaValidator } from "./validator.js"
import { createSmartAccount } from "./account.js"
import { createPaymaster } from "./paymaster.js"
import { createAccountClient } from "./client.js"
import { sendTransaction, sendTransactions, sendUserOperation, sendContractCall } from "./transactions.js"
import { signMessage, signTypedData, verifySignature } from "./signing.js"
import type {
  WalletConfig,
  TransactionRequest,
  PaymasterOptions,
} from "./types.js"

export type Wallet = {
  address: `0x${string}`
  account: any
  client: any
  publicClient: any
  paymasterClient: any | null

  sendTransaction: (tx: TransactionRequest) => Promise<Hex>
  sendTransactions: (txs: TransactionRequest[]) => Promise<Hex>
  sendUserOperation: (callData: Hex) => Promise<{ hash: Hex; wait: () => Promise<any> }>
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

export async function createWallet(config: WalletConfig): Promise<Wallet> {
  const signer = createSigner(config.privateKey)

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
    account,
    client,
    publicClient,
    paymasterClient,

    sendTransaction: (tx) => sendTransaction(client, tx),
    sendTransactions: (txs) => sendTransactions(client, txs),
    sendUserOperation: (callData) => sendUserOperation(client, callData),
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

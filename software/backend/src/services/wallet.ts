import { randomUUID } from "node:crypto"
import type { Hex, Address } from "viem"
import type { WalletsStore } from "../stores/wallets.js"
import type { KeysService } from "./keys.js"
import type { EventsStore } from "../stores/events.js"
import type { Config } from "../config.js"
import type {
  WalletRecord,
  CreateWalletRequest,
  SignMessageRequest,
  SendTransactionRequest,
} from "../types.js"

export type WalletService = {
  create: (request: CreateWalletRequest) => WalletRecord
  get: (id: string) => WalletRecord
  list: () => WalletRecord[]
  delete: (id: string) => void
  signMessage: (walletId: string, request: SignMessageRequest) => Promise<Hex>
  sendTransaction: (walletId: string, request: SendTransactionRequest) => Promise<Hex>
}

export type WalletServiceDeps = {
  walletsStore: WalletsStore
  keysService: KeysService
  eventsStore: EventsStore
  config: Config
}

export function createWalletService(deps: WalletServiceDeps): WalletService {
  const { walletsStore, keysService, eventsStore } = deps

  return {
    create(request) {
      if (!request.name) throw new Error("Name is required")

      const { publicKey, privateKey } = keysService.generateKeyPair()
      const id = randomUUID()
      const now = new Date().toISOString()

      const wallet: WalletRecord = {
        id,
        address: publicKey as Address,
        name: request.name,
        chainId: request.chainId || deps.config.defaultChainId,
        createdAt: now,
        updatedAt: now,
      }

      keysService.storeKey(id, publicKey, privateKey)
      walletsStore.create(wallet)

      return wallet
    },

    get(id) {
      const wallet = walletsStore.get(id)
      if (!wallet) throw new Error("Wallet not found")
      return wallet
    },

    list() {
      return walletsStore.list()
    },

    delete(id) {
      const wallet = walletsStore.get(id)
      if (!wallet) throw new Error("Wallet not found")
      walletsStore.delete(id)
      keysService.deleteKey(id)
    },

    async signMessage(walletId, request) {
      const wallet = walletsStore.get(walletId)
      if (!wallet) throw new Error("Wallet not found")
      if (!request.message) throw new Error("Message is required")

      const privateKey = keysService.retrievePrivateKey(walletId)
      if (!privateKey) throw new Error("Wallet key not found")

      const { privateKeyToAccount } = await import("viem/accounts")
      const account = privateKeyToAccount(privateKey)
      return account.signMessage({ message: request.message })
    },

    async sendTransaction(walletId, request) {
      const wallet = walletsStore.get(walletId)
      if (!wallet) throw new Error("Wallet not found")
      if (!request.to) throw new Error("Recipient address is required")

      const privateKey = keysService.retrievePrivateKey(walletId)
      if (!privateKey) throw new Error("Wallet key not found")

      const { createWalletClient, http } = await import("viem")
      const { privateKeyToAccount } = await import("viem/accounts")
      const { base } = await import("viem/chains")

      const account = privateKeyToAccount(privateKey)
      const client = createWalletClient({
        account,
        chain: base,
        transport: http(deps.config.rpcUrl),
      })

      const hash = await client.sendTransaction({
        to: request.to as Address,
        value: request.value ? BigInt(request.value) : 0n,
        data: (request.data as Hex) || undefined,
      })

      return hash
    },
  }
}

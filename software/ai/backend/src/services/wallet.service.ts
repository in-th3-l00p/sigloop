import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { walletsStore } from "../store/wallets.store.js";
import type { Wallet, CreateWalletRequest } from "../types/wallet.js";

export class WalletService {
  create(request: CreateWalletRequest): Wallet {
    if (!request.name || request.name.trim().length === 0) {
      throw new Error("Wallet name is required");
    }

    const privateKey = generatePrivateKey();
    const account = privateKeyToAccount(privateKey);
    const now = new Date().toISOString();

    const wallet: Wallet = {
      id: crypto.randomUUID(),
      address: account.address,
      name: request.name.trim(),
      chainId: request.chainId ?? 1,
      createdAt: now,
      updatedAt: now,
    };

    return walletsStore.create(wallet);
  }

  get(id: string): Wallet {
    const wallet = walletsStore.get(id);
    if (!wallet) {
      throw new Error(`Wallet not found: ${id}`);
    }
    return wallet;
  }

  list(): Wallet[] {
    return walletsStore.list();
  }

  delete(id: string): void {
    const wallet = walletsStore.get(id);
    if (!wallet) {
      throw new Error(`Wallet not found: ${id}`);
    }
    walletsStore.delete(id);
  }
}

export const walletService = new WalletService();

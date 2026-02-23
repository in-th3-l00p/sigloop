import type { Wallet } from "../types/wallet.js";

const wallets = new Map<string, Wallet>();

export const walletsStore = {
  create(wallet: Wallet): Wallet {
    wallets.set(wallet.id, wallet);
    return wallet;
  },

  get(id: string): Wallet | undefined {
    return wallets.get(id);
  },

  list(): Wallet[] {
    return Array.from(wallets.values());
  },

  update(id: string, data: Partial<Wallet>): Wallet | undefined {
    const existing = wallets.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...data, updatedAt: new Date().toISOString() };
    wallets.set(id, updated);
    return updated;
  },

  delete(id: string): boolean {
    return wallets.delete(id);
  },

  clear(): void {
    wallets.clear();
  },
};

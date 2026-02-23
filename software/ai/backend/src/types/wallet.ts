export interface Wallet {
  id: string;
  address: string;
  name: string;
  chainId: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWalletRequest {
  name: string;
  chainId?: number;
}

export interface WalletResponse {
  wallet: Wallet;
}

export interface WalletListResponse {
  wallets: Wallet[];
  total: number;
}

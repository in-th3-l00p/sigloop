export interface Wallet {
  id: string;
  address: string;
  name: string;
  chainId: number;
  agentCount: number;
  totalSpent: string;
  createdAt: string;
}

export interface CreateWalletRequest {
  name: string;
  chainId: number;
}

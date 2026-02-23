import { apiClient } from "./client";
import type { Wallet, CreateWalletRequest } from "@/types";

export function fetchWallets() {
  return apiClient<Wallet[]>("/wallets");
}

export function fetchWallet(id: string) {
  return apiClient<Wallet>(`/wallets/${id}`);
}

export function createWallet(data: CreateWalletRequest) {
  return apiClient<Wallet>("/wallets", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function deleteWallet(id: string) {
  return apiClient<void>(`/wallets/${id}`, { method: "DELETE" });
}

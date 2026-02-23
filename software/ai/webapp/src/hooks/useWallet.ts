import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchWallets, fetchWallet, createWallet, deleteWallet } from "@/api/wallets";
import type { CreateWalletRequest } from "@/types";

export function useWallets() {
  return useQuery({
    queryKey: ["wallets"],
    queryFn: fetchWallets,
  });
}

export function useWallet(id: string) {
  return useQuery({
    queryKey: ["wallets", id],
    queryFn: () => fetchWallet(id),
    enabled: !!id,
  });
}

export function useCreateWallet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateWalletRequest) => createWallet(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallets"] });
    },
  });
}

export function useDeleteWallet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteWallet(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallets"] });
    },
  });
}

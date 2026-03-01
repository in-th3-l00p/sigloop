import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"

export function useWallets() {
  return useQuery({
    queryKey: ["wallets"],
    queryFn: () => api.wallets.list(),
    select: (d) => d.wallets,
  })
}

export function useWallet(id: string) {
  return useQuery({
    queryKey: ["wallets", id],
    queryFn: () => api.wallets.get(id),
    select: (d) => d.wallet,
    enabled: !!id,
  })
}

export function useCreateWallet() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { name: string; chainId?: number }) => api.wallets.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["wallets"] }),
  })
}

export function useDeleteWallet() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.wallets.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["wallets"] }),
  })
}

export function useSignMessage() {
  return useMutation({
    mutationFn: ({ walletId, message }: { walletId: string; message: string }) =>
      api.wallets.signMessage(walletId, message),
  })
}

export function useSendTransaction() {
  return useMutation({
    mutationFn: ({ walletId, ...data }: { walletId: string; to: string; value?: string; data?: string }) =>
      api.wallets.sendTransaction(walletId, data),
  })
}

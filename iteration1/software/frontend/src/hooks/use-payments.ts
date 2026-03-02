import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"

export function usePayments(filters?: {
  agentId?: string
  walletId?: string
  domain?: string
  startDate?: string
  endDate?: string
}) {
  return useQuery({
    queryKey: ["payments", filters],
    queryFn: () => api.payments.list(filters),
    select: (d) => d.payments,
  })
}

export function usePaymentStats() {
  return useQuery({
    queryKey: ["payments", "stats"],
    queryFn: () => api.payments.stats(),
    select: (d) => d.stats,
    refetchInterval: 30000,
  })
}

export function useBudget(walletId: string) {
  return useQuery({
    queryKey: ["payments", "budget", walletId],
    queryFn: () => api.payments.budget(walletId),
    select: (d) => d.budget,
    enabled: !!walletId,
    refetchInterval: 10000,
  })
}

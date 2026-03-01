import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"

export function useSpendingAnalytics(filters?: {
  period?: string
  startDate?: string
  endDate?: string
  walletId?: string
  agentId?: string
}) {
  return useQuery({
    queryKey: ["analytics", "spending", filters],
    queryFn: () => api.analytics.spending(filters),
    select: (d) => d.spending,
  })
}

export function useAgentAnalytics(filters?: {
  walletId?: string
  limit?: number
  sortBy?: string
}) {
  return useQuery({
    queryKey: ["analytics", "agents", filters],
    queryFn: () => api.analytics.agents(filters),
    select: (d) => d.agents,
  })
}

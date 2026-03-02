import { useQuery } from '@tanstack/react-query'
import { api } from './api'

export const queryKeys = {
    dashboard: ['dashboard'] as const,
    wallets: ['wallets'] as const,
    agents: ['agents'] as const,
    policies: ['policies'] as const,
    payments: ['payments'] as const,
}

export function useDashboardStats() {
    return useQuery({
        queryKey: queryKeys.dashboard,
        queryFn: api.getDashboardStats,
    })
}

export function useWallets() {
    return useQuery({
        queryKey: queryKeys.wallets,
        queryFn: api.getWallets,
    })
}

export function useAgents() {
    return useQuery({
        queryKey: queryKeys.agents,
        queryFn: api.getAgents,
    })
}

export function usePolicies() {
    return useQuery({
        queryKey: queryKeys.policies,
        queryFn: api.getPolicies,
    })
}

export function usePayments() {
    return useQuery({
        queryKey: queryKeys.payments,
        queryFn: api.getPayments,
    })
}

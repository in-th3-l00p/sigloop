import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"

export function useAgents(walletId?: string) {
  return useQuery({
    queryKey: ["agents", { walletId }],
    queryFn: () => api.agents.list(walletId),
    select: (d) => d.agents,
  })
}

export function useAgent(id: string) {
  return useQuery({
    queryKey: ["agents", id],
    queryFn: () => api.agents.get(id),
    select: (d) => d.agent,
    enabled: !!id,
  })
}

export function useAgentSession(id: string) {
  return useQuery({
    queryKey: ["agents", id, "session"],
    queryFn: () => api.agents.getSession(id),
    select: (d) => d.session,
    enabled: !!id,
    refetchInterval: 10000,
  })
}

export function useAgentPolicy(id: string) {
  return useQuery({
    queryKey: ["agents", id, "policy"],
    queryFn: () => api.agents.getPolicy(id),
    select: (d) => d.policy,
    enabled: !!id,
  })
}

export function useCreateAgent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ walletId, ...data }: { walletId: string; name: string; policyId?: string; sessionDuration?: number }) =>
      api.agents.create(walletId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["agents"] }),
  })
}

export function useRevokeAgent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.agents.revoke(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["agents"] }),
  })
}

export function useDeleteAgent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.agents.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["agents"] }),
  })
}

export function useSignUserOp() {
  return useMutation({
    mutationFn: ({ agentId, userOpHash }: { agentId: string; userOpHash: string }) =>
      api.agents.signUserOp(agentId, userOpHash),
  })
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"

export function usePolicies() {
  return useQuery({
    queryKey: ["policies"],
    queryFn: () => api.policies.list(),
    select: (d) => d.policies,
  })
}

export function usePolicy(id: string) {
  return useQuery({
    queryKey: ["policies", id],
    queryFn: () => api.policies.get(id),
    select: (d) => d.policy,
    enabled: !!id,
  })
}

export function useCreatePolicy() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { name: string; type: string; config: Record<string, unknown> }) => api.policies.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["policies"] }),
  })
}

export function useUpdatePolicy() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; name?: string; type?: string; config?: Record<string, unknown> }) =>
      api.policies.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["policies"] }),
  })
}

export function useDeletePolicy() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.policies.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["policies"] }),
  })
}

export function useEncodePolicy() {
  return useMutation({
    mutationFn: (id: string) => api.policies.encode(id),
  })
}

export function useComposePolicies() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (policyIds: string[]) => api.policies.compose(policyIds),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["policies"] }),
  })
}

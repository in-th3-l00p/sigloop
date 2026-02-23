import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchPolicies, fetchPolicy, createPolicy, deletePolicy } from "@/api/policies";
import type { CreatePolicyRequest } from "@/types";

export function usePolicies() {
  return useQuery({
    queryKey: ["policies"],
    queryFn: fetchPolicies,
  });
}

export function usePolicy(id: string) {
  return useQuery({
    queryKey: ["policies", id],
    queryFn: () => fetchPolicy(id),
    enabled: !!id,
  });
}

export function useCreatePolicy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePolicyRequest) => createPolicy(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["policies"] });
    },
  });
}

export function useDeletePolicy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deletePolicy(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["policies"] });
    },
  });
}

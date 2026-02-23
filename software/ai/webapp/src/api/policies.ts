import { apiClient } from "./client";
import type { Policy, CreatePolicyRequest } from "@/types";

export function fetchPolicies() {
  return apiClient<Policy[]>("/policies");
}

export function fetchPolicy(id: string) {
  return apiClient<Policy>(`/policies/${id}`);
}

export function createPolicy(data: CreatePolicyRequest) {
  return apiClient<Policy>("/policies", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function deletePolicy(id: string) {
  return apiClient<void>(`/policies/${id}`, { method: "DELETE" });
}

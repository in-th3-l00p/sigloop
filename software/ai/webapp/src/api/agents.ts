import { apiClient } from "./client";
import type { Agent, CreateAgentRequest } from "@/types";

export function fetchAgents() {
  return apiClient<Agent[]>("/agents");
}

export function fetchAgent(id: string) {
  return apiClient<Agent>(`/agents/${id}`);
}

export function createAgent(data: CreateAgentRequest) {
  return apiClient<Agent>("/agents", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function revokeAgent(id: string) {
  return apiClient<Agent>(`/agents/${id}/revoke`, { method: "POST" });
}

export type AgentStatus = "active" | "revoked" | "expired";

export interface Agent {
  id: string;
  walletId: string;
  name: string;
  sessionKeyAddress: string;
  status: AgentStatus;
  policyId: string;
  createdAt: string;
  expiresAt: string;
}

export interface CreateAgentRequest {
  walletId: string;
  name: string;
  policyId: string;
  expiresAt: string;
}

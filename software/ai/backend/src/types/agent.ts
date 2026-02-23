export enum AgentStatus {
  ACTIVE = "active",
  REVOKED = "revoked",
  EXPIRED = "expired",
}

export interface Agent {
  id: string;
  walletId: string;
  name: string;
  publicKey: string;
  policyId: string | null;
  status: AgentStatus;
  permissions: string[];
  createdAt: string;
  updatedAt: string;
  revokedAt: string | null;
}

export interface CreateAgentRequest {
  name: string;
  policyId?: string;
  permissions?: string[];
}

export interface AgentResponse {
  agent: Agent;
  sessionKey?: string;
}

export interface AgentListResponse {
  agents: Agent[];
  total: number;
}

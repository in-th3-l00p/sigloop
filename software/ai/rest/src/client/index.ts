import type {
  Wallet,
  CreateWalletRequest,
  Agent,
  AgentWithSessionKey,
  CreateAgentRequest,
  Policy,
  CreatePolicyRequest,
  Payment,
  CreatePaymentRequest,
  PaymentStats,
  SpendingData,
  AgentActivity,
  HealthResponse,
} from "../types/index.js";

export class BackendClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
  }

  private async request<T>(path: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Backend ${response.status}: ${body}`);
    }

    return response.json() as Promise<T>;
  }

  async health(): Promise<HealthResponse> {
    return this.request<HealthResponse>("/api/health");
  }

  async createWallet(data: CreateWalletRequest): Promise<Wallet> {
    const res = await this.request<{ wallet: Wallet }>("/api/wallets", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return res.wallet;
  }

  async listWallets(): Promise<Wallet[]> {
    const res = await this.request<{ wallets: Wallet[] }>("/api/wallets");
    return res.wallets;
  }

  async getWallet(id: string): Promise<Wallet> {
    const res = await this.request<{ wallet: Wallet }>(`/api/wallets/${id}`);
    return res.wallet;
  }

  async deleteWallet(id: string): Promise<void> {
    await this.request(`/api/wallets/${id}`, { method: "DELETE" });
  }

  async createAgent(data: CreateAgentRequest): Promise<AgentWithSessionKey> {
    const { walletId, ...body } = data;
    const res = await this.request<{ agent: Agent; sessionKey: string }>(
      `/api/wallets/${walletId}/agents`,
      {
        method: "POST",
        body: JSON.stringify(body),
      }
    );
    return { ...res.agent, sessionKey: res.sessionKey };
  }

  async listAgents(walletId?: string): Promise<Agent[]> {
    const query = walletId ? `?walletId=${walletId}` : "";
    const res = await this.request<{ agents: Agent[] }>(`/api/agents${query}`);
    return res.agents;
  }

  async getAgent(id: string): Promise<Agent> {
    const res = await this.request<{ agent: Agent }>(`/api/agents/${id}`);
    return res.agent;
  }

  async revokeAgent(id: string): Promise<Agent> {
    const res = await this.request<{ agent: Agent }>(
      `/api/agents/${id}/revoke`,
      { method: "POST" }
    );
    return res.agent;
  }

  async deleteAgent(id: string): Promise<void> {
    await this.request(`/api/agents/${id}`, { method: "DELETE" });
  }

  async createPolicy(data: CreatePolicyRequest): Promise<Policy> {
    const res = await this.request<{ policy: Policy }>("/api/policies", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return res.policy;
  }

  async listPolicies(): Promise<Policy[]> {
    const res = await this.request<{ policies: Policy[] }>("/api/policies");
    return res.policies;
  }

  async getPolicy(id: string): Promise<Policy> {
    const res = await this.request<{ policy: Policy }>(
      `/api/policies/${id}`
    );
    return res.policy;
  }

  async updatePolicy(
    id: string,
    data: Partial<CreatePolicyRequest>
  ): Promise<Policy> {
    const res = await this.request<{ policy: Policy }>(`/api/policies/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
    return res.policy;
  }

  async deletePolicy(id: string): Promise<void> {
    await this.request(`/api/policies/${id}`, { method: "DELETE" });
  }

  async createPayment(data: CreatePaymentRequest): Promise<Payment> {
    const res = await this.request<{ payment: Payment }>("/api/payments", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return res.payment;
  }

  async listPayments(filters?: {
    agentId?: string;
    walletId?: string;
    domain?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<Payment[]> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([k, v]) => {
        if (v) params.set(k, v);
      });
    }
    const query = params.toString() ? `?${params.toString()}` : "";
    const res = await this.request<{ payments: Payment[] }>(
      `/api/payments${query}`
    );
    return res.payments;
  }

  async getPaymentStats(): Promise<PaymentStats> {
    const res = await this.request<{ stats: PaymentStats }>(
      "/api/payments/stats"
    );
    return res.stats;
  }

  async getSpending(params?: {
    period?: string;
    startDate?: string;
    endDate?: string;
    walletId?: string;
    agentId?: string;
  }): Promise<SpendingData[]> {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v) query.set(k, v);
      });
    }
    const qs = query.toString() ? `?${query.toString()}` : "";
    const res = await this.request<{ spending: SpendingData[] }>(
      `/api/analytics/spending${qs}`
    );
    return res.spending;
  }

  async getAgentActivity(params?: {
    walletId?: string;
    limit?: number;
    sortBy?: string;
  }): Promise<AgentActivity[]> {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v) query.set(k, String(v));
      });
    }
    const qs = query.toString() ? `?${query.toString()}` : "";
    const res = await this.request<{ agents: AgentActivity[] }>(
      `/api/analytics/agents${qs}`
    );
    return res.agents;
  }
}

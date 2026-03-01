import type {
  WalletRecord,
  AgentResponse,
  AgentWithSessionKey,
  PolicyRecord,
  PaymentRecord,
  PaymentStats,
  BudgetState,
  SessionStatus,
  EncodedCallResult,
  SpendingDataPoint,
  AgentActivity,
} from "@/types"

let baseUrl = ""
let apiKey = ""

export function configureApi(url: string, key: string) {
  baseUrl = url.replace(/\/$/, "")
  apiKey = key
}

export function getApiConfig() {
  return { baseUrl, apiKey }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(apiKey ? { "X-API-KEY": apiKey } : {}),
  }

  const res = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: { ...headers, ...(options?.headers as Record<string, string>) },
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(body.error || body.message || `Request failed: ${res.status}`)
  }

  return res.json()
}

export const api = {
  health: () => request<{ status: string; timestamp: string; version: string }>("/api/health"),

  wallets: {
    list: () => request<{ wallets: WalletRecord[]; total: number }>("/api/wallets"),
    get: (id: string) => request<{ wallet: WalletRecord }>(`/api/wallets/${id}`),
    create: (data: { name: string; chainId?: number }) =>
      request<{ wallet: WalletRecord }>("/api/wallets", { method: "POST", body: JSON.stringify(data) }),
    delete: (id: string) => request<{ message: string }>(`/api/wallets/${id}`, { method: "DELETE" }),
    signMessage: (id: string, message: string) =>
      request<{ signature: string }>(`/api/wallets/${id}/sign-message`, {
        method: "POST",
        body: JSON.stringify({ message }),
      }),
    sendTransaction: (id: string, data: { to: string; value?: string; data?: string }) =>
      request<{ txHash: string }>(`/api/wallets/${id}/send-transaction`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },

  agents: {
    list: (walletId?: string) => {
      const params = walletId ? `?walletId=${walletId}` : ""
      return request<{ agents: AgentResponse[]; total: number }>(`/api/agents${params}`)
    },
    get: (id: string) => request<{ agent: AgentResponse }>(`/api/agents/${id}`),
    create: (walletId: string, data: { name: string; policyId?: string; sessionDuration?: number }) =>
      request<AgentWithSessionKey>(`/api/agents/wallets/${walletId}/agents`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    delete: (id: string) => request<{ message: string }>(`/api/agents/${id}`, { method: "DELETE" }),
    revoke: (id: string) => request<{ agent: AgentResponse }>(`/api/agents/${id}/revoke`, { method: "POST" }),
    signUserOp: (id: string, userOpHash: string) =>
      request<{ signature: string }>(`/api/agents/${id}/sign-user-op`, {
        method: "POST",
        body: JSON.stringify({ userOpHash }),
      }),
    getPolicy: (id: string) => request<{ policy: Record<string, unknown> | null }>(`/api/agents/${id}/policy`),
    getSession: (id: string) => request<{ session: SessionStatus }>(`/api/agents/${id}/session`),
  },

  policies: {
    list: () => request<{ policies: PolicyRecord[]; total: number }>("/api/policies"),
    get: (id: string) => request<{ policy: PolicyRecord }>(`/api/policies/${id}`),
    create: (data: { name: string; type: string; config: Record<string, unknown> }) =>
      request<{ policy: PolicyRecord }>("/api/policies", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: { name?: string; type?: string; config?: Record<string, unknown> }) =>
      request<{ policy: PolicyRecord }>(`/api/policies/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: string) => request<{ message: string }>(`/api/policies/${id}`, { method: "DELETE" }),
    encode: (id: string) => request<{ encoded: string }>(`/api/policies/${id}/encode`, { method: "POST" }),
    compose: (policyIds: string[]) =>
      request<{ policy: PolicyRecord }>("/api/policies/compose", { method: "POST", body: JSON.stringify({ policyIds }) }),
  },

  payments: {
    list: (filters?: { agentId?: string; walletId?: string; domain?: string; startDate?: string; endDate?: string }) => {
      const params = new URLSearchParams()
      if (filters) {
        for (const [k, v] of Object.entries(filters)) {
          if (v) params.set(k, v)
        }
      }
      const qs = params.toString()
      return request<{ payments: PaymentRecord[]; total: number }>(`/api/payments${qs ? `?${qs}` : ""}`)
    },
    stats: () => request<{ stats: PaymentStats }>("/api/payments/stats"),
    budget: (walletId: string) => request<{ budget: BudgetState }>(`/api/payments/budgets/${walletId}`),
    checkBudget: (walletId: string, amount: string, domain?: string) =>
      request<{ allowed: boolean; reason?: string }>(`/api/payments/budgets/${walletId}/check`, {
        method: "POST",
        body: JSON.stringify({ amount, domain }),
      }),
  },

  defi: {
    encodeSwap: (data: {
      chainId: number
      tokenIn: string
      tokenOut: string
      amountIn: string
      minAmountOut: string
      recipient: string
    }) => request<{ result: EncodedCallResult }>("/api/defi/swap/encode", { method: "POST", body: JSON.stringify(data) }),
    encodeSupply: (data: { chainId: number; asset: string; amount: string; onBehalfOf: string }) =>
      request<{ result: EncodedCallResult }>("/api/defi/supply/encode", { method: "POST", body: JSON.stringify(data) }),
    encodeBorrow: (data: { chainId: number; asset: string; amount: string; onBehalfOf: string }) =>
      request<{ result: EncodedCallResult }>("/api/defi/borrow/encode", { method: "POST", body: JSON.stringify(data) }),
    encodeRepay: (data: { chainId: number; asset: string; amount: string; onBehalfOf: string }) =>
      request<{ result: EncodedCallResult }>("/api/defi/repay/encode", { method: "POST", body: JSON.stringify(data) }),
    encodeApprove: (data: { token: string; spender: string; amount: string }) =>
      request<{ result: { to: string; data: string } }>("/api/defi/approve/encode", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },

  analytics: {
    spending: (filters?: { period?: string; startDate?: string; endDate?: string; walletId?: string; agentId?: string }) => {
      const params = new URLSearchParams()
      if (filters) {
        for (const [k, v] of Object.entries(filters)) {
          if (v) params.set(k, v)
        }
      }
      const qs = params.toString()
      return request<{ spending: SpendingDataPoint[] }>(`/api/analytics/spending${qs ? `?${qs}` : ""}`)
    },
    agents: (filters?: { walletId?: string; limit?: number; sortBy?: string }) => {
      const params = new URLSearchParams()
      if (filters) {
        for (const [k, v] of Object.entries(filters)) {
          if (v) params.set(k, String(v))
        }
      }
      const qs = params.toString()
      return request<{ agents: AgentActivity[] }>(`/api/analytics/agents${qs ? `?${qs}` : ""}`)
    },
  },
}

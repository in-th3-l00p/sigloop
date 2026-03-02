// Mock Models
export interface Wallet {
    id: string
    name: string
    address: string
    chain: string
    chainId: number
    agentCount: number
    createdAt: string
    budget: { dailyLimit: number; dailyUsed: number }
}

export interface Agent {
    id: string
    name: string
    walletId: string
    walletName: string
    address: string
    status: 'active' | 'revoked' | 'expired'
    sessionExpiresAt: string
    policyId?: string
    createdAt: string
    totalSpent: number
}

export interface Policy {
    id: string
    name: string
    type: 'agent' | 'x402' | 'spending'
    bounds: number
    createdAt: string
}

export interface Payment {
    id: string
    agentId: string
    agentName: string
    walletId: string
    walletName: string
    domain: string
    amount: number
    currency: string
    timestamp: string
}

export interface DashboardStats {
    wallets: number
    agentsActive: number
    agentsRevoked: number
    paymentsToday: number
    budgetUsedPct: number
    topAgents: Agent[]
}

// Mock Data
const MOCK_WALLETS: Wallet[] = [
    { id: 'w1', name: 'ops-wallet', address: '0x1A2b...3c4D', chain: 'Base', chainId: 8453, agentCount: 4, createdAt: '2025-02-28T10:00:00Z', budget: { dailyLimit: 100, dailyUsed: 67 } },
    { id: 'w2', name: 'research-wallet', address: '0x5e6F...7g8H', chain: 'Arbitrum', chainId: 42161, agentCount: 1, createdAt: '2025-02-25T14:30:00Z', budget: { dailyLimit: 50, dailyUsed: 12 } },
]

const MOCK_AGENTS: Agent[] = [
    { id: 'a1', name: 'agent-gpt4', walletId: 'w1', walletName: 'ops-wallet', address: '0xabc...def', status: 'active', sessionExpiresAt: new Date(Date.now() + 23 * 3600 * 1000).toISOString(), policyId: 'p1', createdAt: '2025-03-01T08:00:00Z', totalSpent: 12.84 },
    { id: 'a2', name: 'researcher', walletId: 'w2', walletName: 'research-wallet', address: '0xdef...123', status: 'active', sessionExpiresAt: new Date(Date.now() + 6 * 24 * 3600 * 1000).toISOString(), policyId: 'p2', createdAt: '2025-02-25T15:00:00Z', totalSpent: 3.21 },
    { id: 'a3', name: 'old-agent', walletId: 'w1', walletName: 'ops-wallet', address: '0x123...456', status: 'revoked', sessionExpiresAt: '', createdAt: '2025-02-01T10:00:00Z', totalSpent: 45.00 },
    { id: 'a4', name: 'test-agent', walletId: 'w1', walletName: 'ops-wallet', address: '0x456...789', status: 'expired', sessionExpiresAt: '2025-02-20T10:00:00Z', policyId: 'p3', createdAt: '2025-02-19T10:00:00Z', totalSpent: 0 },
]

const MOCK_POLICIES: Policy[] = [
    { id: 'p1', name: 'spending-limits-v1', type: 'agent', bounds: 2, createdAt: '2025-02-28T09:00:00Z' },
    { id: 'p2', name: 'api-allowlist', type: 'agent', bounds: 1, createdAt: '2025-02-29T11:00:00Z' },
    { id: 'p3', name: 'x402-budget-default', type: 'x402', bounds: 0, createdAt: '2025-02-20T09:00:00Z' },
]

const MOCK_PAYMENTS: Payment[] = [
    { id: 'pay1', agentId: 'a1', agentName: 'agent-gpt4', walletId: 'w1', walletName: 'ops-wallet', domain: 'api.example.com', amount: 0.003, currency: 'USDC', timestamp: new Date(Date.now() - 2 * 60000).toISOString() },
    { id: 'pay2', agentId: 'a2', agentName: 'researcher', walletId: 'w2', walletName: 'research-wallet', domain: 'data.service.io', amount: 0.010, currency: 'USDC', timestamp: new Date(Date.now() - 15 * 60000).toISOString() },
    { id: 'pay3', agentId: 'a1', agentName: 'agent-gpt4', walletId: 'w1', walletName: 'ops-wallet', domain: 'api.example.com', amount: 0.003, currency: 'USDC', timestamp: new Date(Date.now() - 60 * 60000).toISOString() },
]

// Simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export const api = {
    getDashboardStats: async (): Promise<DashboardStats> => {
        await delay(600)
        return {
            wallets: MOCK_WALLETS.length,
            agentsActive: MOCK_AGENTS.filter(a => a.status === 'active').length,
            agentsRevoked: MOCK_AGENTS.filter(a => a.status === 'revoked').length,
            paymentsToday: 18.42,
            budgetUsedPct: 67,
            topAgents: [...MOCK_AGENTS].sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 3)
        }
    },

    getWallets: async (): Promise<Wallet[]> => {
        await delay(500)
        return MOCK_WALLETS
    },

    getAgents: async (): Promise<Agent[]> => {
        await delay(500)
        return MOCK_AGENTS
    },

    getPolicies: async (): Promise<Policy[]> => {
        await delay(400)
        return MOCK_POLICIES
    },

    getPayments: async (): Promise<Payment[]> => {
        await delay(600)
        return MOCK_PAYMENTS
    }
}

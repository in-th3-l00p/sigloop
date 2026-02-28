import { Kind } from "graphql"
import type { Hex } from "viem"
import type { WalletService } from "../services/wallet.js"
import type { AgentService } from "../services/agent.js"
import type { PolicyService } from "../services/policy.js"
import type { PaymentService } from "../services/payment.js"
import type { DeFiService } from "../services/defi.js"
import type { AnalyticsService } from "../services/analytics.js"

export type ResolversDeps = {
  walletService: WalletService
  agentService: AgentService
  policyService: PolicyService
  paymentService: PaymentService
  defiService: DeFiService
  analyticsService: AnalyticsService
}

function parseLiteral(ast: any): any {
  switch (ast.kind) {
    case Kind.STRING:
    case Kind.BOOLEAN:
      return ast.value
    case Kind.INT:
    case Kind.FLOAT:
      return parseFloat(ast.value)
    case Kind.OBJECT:
      return ast.fields.reduce((obj: any, field: any) => {
        obj[field.name.value] = parseLiteral(field.value)
        return obj
      }, {})
    case Kind.LIST:
      return ast.values.map((v: any) => parseLiteral(v))
    case Kind.NULL:
      return null
    default:
      return ast.value
  }
}

export function createResolvers(deps: ResolversDeps) {
  const { walletService, agentService, policyService, paymentService, defiService, analyticsService } = deps

  return {
    Query: {
      wallet: (_: any, { id }: { id: string }) => {
        try { return walletService.get(id) } catch { return null }
      },
      wallets: () => walletService.list(),
      agent: (_: any, { id }: { id: string }) => {
        try { return agentService.get(id) } catch { return null }
      },
      agents: (_: any, { walletId }: { walletId?: string }) => agentService.list(walletId),
      policy: (_: any, { id }: { id: string }) => {
        try { return policyService.get(id) } catch { return null }
      },
      policies: () => policyService.list(),
      payments: (_: any, { filters }: { filters?: any }) => paymentService.list(filters),
      paymentStats: () => paymentService.getStats(),
      budget: (_: any, { walletId }: { walletId: string }) => paymentService.getBudget(walletId),
      agentPolicy: (_: any, { agentId }: { agentId: string }) => agentService.getPolicy(agentId),
      agentSession: (_: any, { agentId }: { agentId: string }) => agentService.getSession(agentId),
      spendingAnalytics: (_: any, { filters }: { filters?: any }) => analyticsService.getSpending(filters),
      agentAnalytics: (_: any, { filters }: { filters?: any }) => analyticsService.getAgentActivity(filters),
    },

    Mutation: {
      createWallet: (_: any, { input }: { input: any }) => walletService.create(input),
      deleteWallet: (_: any, { id }: { id: string }) => {
        walletService.delete(id)
        return true
      },
      signMessage: async (_: any, { walletId, message }: { walletId: string; message: string }) => {
        const signature = await walletService.signMessage(walletId, { message })
        return { signature }
      },
      sendTransaction: async (_: any, args: { walletId: string; to: string; value?: string; data?: string }) => {
        const txHash = await walletService.sendTransaction(args.walletId, { to: args.to, value: args.value, data: args.data })
        return { txHash }
      },
      createAgent: (_: any, { walletId, input }: { walletId: string; input: any }) => agentService.create(walletId, input),
      revokeAgent: (_: any, { id }: { id: string }) => agentService.revoke(id),
      deleteAgent: (_: any, { id }: { id: string }) => {
        agentService.delete(id)
        return true
      },
      signUserOp: async (_: any, { agentId, userOpHash }: { agentId: string; userOpHash: string }) => {
        const signature = await agentService.signUserOp(agentId, userOpHash as Hex)
        return { signature }
      },
      createPolicy: (_: any, { input }: { input: any }) => policyService.create(input),
      updatePolicy: (_: any, { id, input }: { id: string; input: any }) => policyService.update(id, input),
      deletePolicy: (_: any, { id }: { id: string }) => {
        policyService.delete(id)
        return true
      },
      encodePolicy: (_: any, { id }: { id: string }) => policyService.encode(id),
      composePolicies: (_: any, { policyIds }: { policyIds: string[] }) => policyService.compose(policyIds),
      recordPayment: (_: any, { input }: { input: any }) => paymentService.record(input),
      checkBudget: (_: any, { walletId, amount, domain }: { walletId: string; amount: string; domain?: string }) =>
        paymentService.checkBudget(walletId, { amount, domain }),
      encodeSwap: (_: any, { input }: { input: any }) => defiService.encodeSwap(input),
      encodeSupply: (_: any, { input }: { input: any }) => defiService.encodeSupply(input),
      encodeBorrow: (_: any, { input }: { input: any }) => defiService.encodeBorrow(input),
      encodeRepay: (_: any, { input }: { input: any }) => defiService.encodeRepay(input),
      encodeApprove: (_: any, { input }: { input: any }) => defiService.encodeApprove(input),
    },

    JSON: {
      __serialize: (value: any) => value,
      __parseValue: (value: any) => value,
      __parseLiteral: parseLiteral,
    },
  }
}

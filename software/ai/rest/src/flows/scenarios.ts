import { Hono } from "hono";
import type { BackendClient } from "../client/index.js";
import type { Wallet, AgentWithSessionKey, Payment } from "../types/index.js";
import { FlowRunner } from "./runner.js";

interface ApiConfig {
  domain: string;
  costPerCall: string;
}

interface ChainConfig {
  name: string;
  chainId: number;
}

export function scenarioFlows(client: BackendClient) {
  const app = new Hono();

  app.post("/defi-trading-bot", async (c) => {
    const body = await c.req.json();
    const {
      botName = "DeFi Trading Bot",
      tradingPairs = ["ETH/USDC", "WBTC/USDC", "ARB/USDC"],
      dailyBudget = "1000.000000",
      tradeSize = "50.000000",
      tradeCount = 5,
    } = body;

    const flow = new FlowRunner();

    const wallet = await flow.run("create-treasury-wallet", () =>
      client.createWallet({ name: `${botName} Treasury`, chainId: 42161 })
    );

    const tradingPolicy = await flow.run("create-trading-policy", () =>
      client.createPolicy({
        name: `${botName} Limits`,
        description: `Trading policy for ${tradingPairs.join(", ")}`,
        rules: [
          {
            type: "spending_limit" as const,
            spendingLimit: {
              maxAmount: dailyBudget,
              period: "daily",
              currency: "USDC",
            },
          },
          {
            type: "allowlist" as const,
            allowlist: {
              addresses: [],
              domains: ["uniswap.org", "app.aave.com", "dex.arbitrum.io"],
            },
          },
          {
            type: "time_window" as const,
            timeWindow: {
              startHour: 0,
              endHour: 23,
              daysOfWeek: [1, 2, 3, 4, 5],
              timezone: "UTC",
            },
          },
        ],
      })
    );

    const tradingAgent = await flow.run("create-trading-agent", () =>
      client.createAgent({
        walletId: wallet.id,
        name: botName,
        policyId: tradingPolicy.id,
        permissions: ["swap", "transfer"],
      })
    );

    const trades = [];
    for (let i = 0; i < tradeCount; i++) {
      const pair = tradingPairs[i % tradingPairs.length];
      const trade = await flow.run(`execute-trade-${i + 1}-${pair}`, () =>
        client.createPayment({
          agentId: tradingAgent.id,
          walletId: wallet.id,
          domain: "uniswap.org",
          amount: tradeSize,
          metadata: {
            pair,
            action: i % 2 === 0 ? "buy" : "sell",
            tradeIndex: String(i + 1),
          },
        })
      );
      trades.push(trade);
    }

    const activity = await flow.run("fetch-agent-activity", () =>
      client.getAgentActivity({ walletId: wallet.id })
    );

    return c.json(
      flow.result({
        wallet,
        tradingAgent,
        tradingPolicy,
        trades,
        activity,
      }),
      201
    );
  });

  app.post("/api-marketplace-consumer", async (c) => {
    const body = await c.req.json();
    const {
      consumerName = "Data Pipeline Agent",
      apis = [
        { domain: "weather.api.io", costPerCall: "0.010000" },
        { domain: "market.data.com", costPerCall: "0.050000" },
        { domain: "nlp.inference.ai", costPerCall: "0.100000" },
      ],
      callsPerApi = 3,
      monthlyBudget = "500.000000",
    } = body;

    const flow = new FlowRunner();

    const wallet = await flow.run("create-consumer-wallet", () =>
      client.createWallet({ name: `${consumerName} Wallet`, chainId: 8453 })
    );

    const budgetPolicy = await flow.run("create-budget-policy", () =>
      client.createPolicy({
        name: `${consumerName} Budget`,
        rules: [
          {
            type: "spending_limit" as const,
            spendingLimit: {
              maxAmount: monthlyBudget,
              period: "monthly",
              currency: "USDC",
            },
          },
          {
            type: "allowlist" as const,
            allowlist: {
              addresses: [],
              domains: apis.map((a: ApiConfig) => a.domain),
            },
          },
        ],
      })
    );

    const agent = await flow.run("create-consumer-agent", () =>
      client.createAgent({
        walletId: wallet.id,
        name: consumerName,
        policyId: budgetPolicy.id,
        permissions: ["transfer"],
      })
    );

    const apiCalls = [];
    for (const api of apis) {
      for (let i = 0; i < callsPerApi; i++) {
        const call = await flow.run(
          `x402-call-${api.domain}-${i + 1}`,
          () =>
            client.createPayment({
              agentId: agent.id,
              walletId: wallet.id,
              domain: api.domain,
              amount: api.costPerCall,
              metadata: {
                requestType: "x402",
                callIndex: String(i + 1),
                endpoint: `/v1/${api.domain.split(".")[0]}`,
              },
            })
        );
        apiCalls.push(call);
      }
    }

    const stats = await flow.run("fetch-spending-stats", () =>
      client.getPaymentStats()
    );

    return c.json(
      flow.result({
        wallet,
        agent,
        budgetPolicy,
        apiCalls,
        stats,
        summary: {
          totalCalls: apiCalls.length,
          totalSpent: apiCalls
            .reduce((sum, p) => sum + parseFloat(p.amount), 0)
            .toFixed(6),
          byDomain: apis.map((a: ApiConfig) => ({
            domain: a.domain,
            calls: callsPerApi,
            spent: (parseFloat(a.costPerCall) * callsPerApi).toFixed(6),
          })),
        },
      }),
      201
    );
  });

  app.post("/multi-chain-operations", async (c) => {
    const body = await c.req.json();
    const {
      chains = [
        { name: "Base", chainId: 8453 },
        { name: "Arbitrum", chainId: 42161 },
        { name: "Anvil Local", chainId: 31337 },
      ],
      agentName = "Cross-Chain Agent",
      paymentPerChain = "25.000000",
    } = body;

    const flow = new FlowRunner();

    const wallets: Wallet[] = [];
    for (const chain of chains) {
      const wallet = await flow.run(
        `create-wallet-${chain.name}`,
        () =>
          client.createWallet({
            name: `${chain.name} Wallet`,
            chainId: chain.chainId,
          })
      );
      wallets.push(wallet);
    }

    const policy = await flow.run("create-cross-chain-policy", () =>
      client.createPolicy({
        name: "Cross-Chain Policy",
        rules: [
          {
            type: "spending_limit" as const,
            spendingLimit: {
              maxAmount: "1000.000000",
              period: "daily",
              currency: "USDC",
            },
          },
        ],
      })
    );

    const agents: AgentWithSessionKey[] = [];
    for (const wallet of wallets) {
      const agent = await flow.run(
        `create-agent-${wallet.name}`,
        () =>
          client.createAgent({
            walletId: wallet.id,
            name: `${agentName} (${wallet.name})`,
            policyId: policy.id,
            permissions: ["transfer", "swap", "bridge"],
          })
      );
      agents.push(agent);
    }

    const payments: Payment[] = [];
    for (let i = 0; i < agents.length; i++) {
      const payment = await flow.run(
        `payment-chain-${chains[i].name}`,
        () =>
          client.createPayment({
            agentId: agents[i].id,
            walletId: wallets[i].id,
            domain: `bridge.${chains[i].name.toLowerCase()}.io`,
            amount: paymentPerChain,
            metadata: {
              chainId: String(chains[i].chainId),
              chainName: chains[i].name,
              operation: "bridge-transfer",
            },
          })
      );
      payments.push(payment);
    }

    return c.json(
      flow.result({
        wallets,
        agents,
        policy,
        payments,
        chains: chains.map((ch: ChainConfig, i: number) => ({
          ...ch,
          walletId: wallets[i].id,
          agentId: agents[i].id,
        })),
      }),
      201
    );
  });

  return app;
}

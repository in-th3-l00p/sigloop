import { Hono } from "hono";
import type { BackendClient } from "../client/index.js";
import { FlowRunner } from "./runner.js";
import type { PaymentFlowResult } from "../types/index.js";

export function paymentFlows(client: BackendClient) {
  const app = new Hono();

  app.post("/x402-simulation", async (c) => {
    const body = await c.req.json();
    const {
      walletName = "x402 Wallet",
      agentName = "x402 Agent",
      spendingLimit = "50.000000",
      payments = [
        { domain: "api.example.com", amount: "1.500000" },
        { domain: "data.provider.io", amount: "3.250000" },
        { domain: "api.example.com", amount: "2.000000" },
      ],
    } = body;

    const flow = new FlowRunner();

    const wallet = await flow.run("create-wallet", () =>
      client.createWallet({ name: walletName, chainId: 31337 })
    );

    const policy = await flow.run("create-spending-policy", () =>
      client.createPolicy({
        name: "x402 Budget",
        rules: [
          {
            type: "spending_limit" as const,
            spendingLimit: {
              maxAmount: spendingLimit,
              period: "daily",
              currency: "USDC",
            },
          },
        ],
      })
    );

    const agent = await flow.run("create-agent", () =>
      client.createAgent({
        walletId: wallet.id,
        name: agentName,
        policyId: policy.id,
        permissions: ["transfer"],
      })
    );

    const recordedPayments = [];
    for (let i = 0; i < payments.length; i++) {
      const p = payments[i];
      const payment = await flow.run(`record-payment-${i + 1}`, () =>
        client.createPayment({
          agentId: agent.id,
          walletId: wallet.id,
          domain: p.domain,
          amount: p.amount,
          currency: p.currency || "USDC",
          metadata: p.metadata || {},
        })
      );
      recordedPayments.push(payment);
    }

    const stats = await flow.run("fetch-stats", () =>
      client.getPaymentStats()
    );

    const result: PaymentFlowResult = {
      wallet,
      agent,
      policy,
      payments: recordedPayments,
      stats,
    };
    return c.json(flow.result(result), 201);
  });

  app.post("/budget-exhaustion", async (c) => {
    const body = await c.req.json();
    const {
      walletName = "Budget Test Wallet",
      agentName = "Budget Agent",
      budgetLimit = "10.000000",
      paymentAmount = "3.500000",
      paymentCount = 4,
      domain = "test.service.io",
    } = body;

    const flow = new FlowRunner();

    const wallet = await flow.run("create-wallet", () =>
      client.createWallet({ name: walletName, chainId: 31337 })
    );

    const policy = await flow.run("create-budget-policy", () =>
      client.createPolicy({
        name: "Tight Budget",
        rules: [
          {
            type: "spending_limit" as const,
            spendingLimit: {
              maxAmount: budgetLimit,
              period: "daily",
              currency: "USDC",
            },
          },
        ],
      })
    );

    const agent = await flow.run("create-agent", () =>
      client.createAgent({
        walletId: wallet.id,
        name: agentName,
        policyId: policy.id,
        permissions: ["transfer"],
      })
    );

    const payments = [];
    let totalSpent = 0;
    const budget = parseFloat(budgetLimit);

    for (let i = 0; i < paymentCount; i++) {
      const amount = parseFloat(paymentAmount);
      const wouldExceed = totalSpent + amount > budget;

      const payment = await flow.run(
        `payment-${i + 1}${wouldExceed ? "-exceeds-budget" : ""}`,
        () =>
          client.createPayment({
            agentId: agent.id,
            walletId: wallet.id,
            domain,
            amount: paymentAmount,
            metadata: {
              attemptNumber: String(i + 1),
              budgetRemaining: String(
                Math.max(0, budget - totalSpent).toFixed(6)
              ),
              wouldExceedBudget: String(wouldExceed),
            },
          })
      );
      totalSpent += amount;
      payments.push(payment);
    }

    const stats = await flow.run("fetch-final-stats", () =>
      client.getPaymentStats()
    );

    return c.json(
      flow.result({
        wallet,
        agent,
        policy,
        payments,
        stats,
        budgetAnalysis: {
          budgetLimit,
          totalSpent: totalSpent.toFixed(6),
          exceeded: totalSpent > budget,
          overageAmount: Math.max(0, totalSpent - budget).toFixed(6),
        },
      }),
      201
    );
  });

  return app;
}

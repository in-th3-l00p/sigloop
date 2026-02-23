import { Hono } from "hono";
import type { BackendClient } from "../client/index.js";
import { FlowRunner } from "./runner.js";
import type { LifecycleResult } from "../types/index.js";

export function lifecycleFlows(client: BackendClient) {
  const app = new Hono();

  app.post("/agent-lifecycle", async (c) => {
    const body = await c.req.json();
    const {
      walletName = "Lifecycle Wallet",
      agentName = "Lifecycle Agent",
      paymentDomain = "lifecycle.test.io",
      paymentAmount = "5.000000",
      paymentCount = 3,
    } = body;

    const flow = new FlowRunner();

    const wallet = await flow.run("create-wallet", () =>
      client.createWallet({ name: walletName, chainId: 31337 })
    );

    const policy = await flow.run("create-policy", () =>
      client.createPolicy({
        name: "Lifecycle Policy",
        rules: [
          {
            type: "spending_limit" as const,
            spendingLimit: {
              maxAmount: "100.000000",
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
        permissions: ["transfer", "swap"],
      })
    );

    const payments = [];
    for (let i = 0; i < paymentCount; i++) {
      const payment = await flow.run(`active-payment-${i + 1}`, () =>
        client.createPayment({
          agentId: agent.id,
          walletId: wallet.id,
          domain: paymentDomain,
          amount: paymentAmount,
        })
      );
      payments.push(payment);
    }

    const revokedAgent = await flow.run("revoke-agent", () =>
      client.revokeAgent(agent.id)
    );

    const postRevokeWallet = await flow.run("verify-wallet-state", () =>
      client.getWallet(wallet.id)
    );

    const result: LifecycleResult = {
      wallet,
      agent,
      policy,
      payments,
      revokedAgent,
      postRevokeWallet,
    };
    return c.json(flow.result(result), 201);
  });

  app.post("/policy-update", async (c) => {
    const body = await c.req.json();
    const {
      walletName = "Policy Update Wallet",
      agentName = "Policy Agent",
    } = body;

    const flow = new FlowRunner();

    const wallet = await flow.run("create-wallet", () =>
      client.createWallet({ name: walletName, chainId: 31337 })
    );

    const policy = await flow.run("create-initial-policy", () =>
      client.createPolicy({
        name: "Restrictive Policy",
        description: "Initial restrictive settings",
        rules: [
          {
            type: "spending_limit" as const,
            spendingLimit: {
              maxAmount: "10.000000",
              period: "daily",
              currency: "USDC",
            },
          },
          {
            type: "allowlist" as const,
            allowlist: {
              addresses: [],
              domains: ["trusted.api.com"],
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

    const payment1 = await flow.run("payment-under-initial-policy", () =>
      client.createPayment({
        agentId: agent.id,
        walletId: wallet.id,
        domain: "trusted.api.com",
        amount: "5.000000",
      })
    );

    const updatedPolicy = await flow.run("expand-policy", () =>
      client.updatePolicy(policy.id, {
        name: "Expanded Policy",
        description: "Relaxed settings after trust established",
        rules: [
          {
            type: "spending_limit" as const,
            spendingLimit: {
              maxAmount: "500.000000",
              period: "daily",
              currency: "USDC",
            },
          },
          {
            type: "allowlist" as const,
            allowlist: {
              addresses: [],
              domains: ["trusted.api.com", "new.service.io", "data.feed.xyz"],
            },
          },
        ],
      })
    );

    const payment2 = await flow.run("payment-under-expanded-policy", () =>
      client.createPayment({
        agentId: agent.id,
        walletId: wallet.id,
        domain: "new.service.io",
        amount: "50.000000",
      })
    );

    return c.json(
      flow.result({
        wallet,
        agent,
        initialPolicy: policy,
        updatedPolicy,
        payments: [payment1, payment2],
      }),
      201
    );
  });

  app.post("/cleanup", async (c) => {
    const flow = new FlowRunner();

    const agents = await flow.run("list-agents", () => client.listAgents());

    for (const agent of agents) {
      if (agent.status === "active") {
        await flow.run(`revoke-agent-${agent.id}`, () =>
          client.revokeAgent(agent.id)
        );
      }
      await flow.run(`delete-agent-${agent.id}`, () =>
        client.deleteAgent(agent.id)
      );
    }

    const policies = await flow.run("list-policies", () =>
      client.listPolicies()
    );
    for (const policy of policies) {
      await flow.run(`delete-policy-${policy.id}`, () =>
        client.deletePolicy(policy.id)
      );
    }

    const wallets = await flow.run("list-wallets", () =>
      client.listWallets()
    );
    for (const wallet of wallets) {
      await flow.run(`delete-wallet-${wallet.id}`, () =>
        client.deleteWallet(wallet.id)
      );
    }

    return c.json(
      flow.result({
        deleted: {
          agents: agents.length,
          policies: policies.length,
          wallets: wallets.length,
        },
      })
    );
  });

  return app;
}

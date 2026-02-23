import { Hono } from "hono";
import type { BackendClient } from "../client/index.js";
import { FlowRunner } from "./runner.js";
import type { AgentOnboardingResult } from "../types/index.js";

export function onboardingFlows(client: BackendClient) {
  const app = new Hono();

  app.post("/agent-onboarding", async (c) => {
    const body = await c.req.json();
    const {
      walletName = "Test Wallet",
      chainId = 31337,
      agentName = "Test Agent",
      policyName = "Default Policy",
      spendingLimit = "100.000000",
      spendingPeriod = "daily",
      allowedDomains = [],
      permissions = ["transfer", "swap"],
    } = body;

    const flow = new FlowRunner();

    const wallet = await flow.run("create-wallet", () =>
      client.createWallet({ name: walletName, chainId })
    );

    const policy = await flow.run("create-policy", () =>
      client.createPolicy({
        name: policyName,
        rules: [
          {
            type: "spending_limit" as const,
            spendingLimit: {
              maxAmount: spendingLimit,
              period: spendingPeriod,
              currency: "USDC",
            },
          },
          ...(allowedDomains.length > 0
            ? [
                {
                  type: "allowlist" as const,
                  allowlist: { addresses: [], domains: allowedDomains },
                },
              ]
            : []),
        ],
      })
    );

    const agent = await flow.run("create-agent", () =>
      client.createAgent({
        walletId: wallet.id,
        name: agentName,
        policyId: policy.id,
        permissions,
      })
    );

    const result: AgentOnboardingResult = { wallet, agent, policy };
    return c.json(flow.result(result), 201);
  });

  app.post("/multi-agent-setup", async (c) => {
    const body = await c.req.json();
    const {
      walletName = "Multi-Agent Wallet",
      chainId = 31337,
      agents: agentConfigs = [
        { name: "Reader Agent", permissions: ["read"], limit: "10.000000" },
        { name: "Trader Agent", permissions: ["swap", "transfer"], limit: "500.000000" },
        { name: "Admin Agent", permissions: ["transfer", "swap", "manage"], limit: "1000.000000" },
      ],
    } = body;

    const flow = new FlowRunner();

    const wallet = await flow.run("create-wallet", () =>
      client.createWallet({ name: walletName, chainId })
    );

    const policies = [];
    const createdAgents = [];

    for (const config of agentConfigs) {
      const policy = await flow.run(`create-policy-${config.name}`, () =>
        client.createPolicy({
          name: `${config.name} Policy`,
          rules: [
            {
              type: "spending_limit" as const,
              spendingLimit: {
                maxAmount: config.limit || "100.000000",
                period: "daily",
                currency: "USDC",
              },
            },
          ],
        })
      );
      policies.push(policy);

      const agent = await flow.run(`create-agent-${config.name}`, () =>
        client.createAgent({
          walletId: wallet.id,
          name: config.name,
          policyId: policy.id,
          permissions: config.permissions || [],
        })
      );
      createdAgents.push(agent);
    }

    return c.json(
      flow.result({ wallet, agents: createdAgents, policies }),
      201
    );
  });

  return app;
}

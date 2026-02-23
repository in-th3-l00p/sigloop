import { Hono } from "hono";
import { cors } from "hono/cors";
import { serve } from "@hono/node-server";
import { BackendClient } from "./client/index.js";
import { errorHandler } from "./middleware/error.js";
import { requestLogger } from "./middleware/logger.js";
import { walletRoutes } from "./routes/wallets.js";
import { agentRoutes } from "./routes/agents.js";
import { policyRoutes } from "./routes/policies.js";
import { paymentRoutes } from "./routes/payments.js";
import { analyticsRoutes } from "./routes/analytics.js";
import { healthRoutes } from "./routes/health.js";
import { onboardingFlows } from "./flows/onboarding.js";
import { paymentFlows } from "./flows/payment.js";
import { lifecycleFlows } from "./flows/lifecycle.js";
import { scenarioFlows } from "./flows/scenarios.js";

const PORT = Number(process.env.PORT || 3002);
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";

const client = new BackendClient(BACKEND_URL);
const app = new Hono();

app.use("*", cors());
app.use("*", errorHandler);
app.use("*", requestLogger);

app.route("/api/wallets", walletRoutes(client));
app.route("/api/agents", agentRoutes(client));
app.route("/api/policies", policyRoutes(client));
app.route("/api/payments", paymentRoutes(client));
app.route("/api/analytics", analyticsRoutes(client));
app.route("/api/health", healthRoutes(client));

app.route("/api/flows/onboarding", onboardingFlows(client));
app.route("/api/flows/payment", paymentFlows(client));
app.route("/api/flows/lifecycle", lifecycleFlows(client));
app.route("/api/flows/scenarios", scenarioFlows(client));

app.get("/api/flows", (c) => {
  return c.json({
    flows: {
      onboarding: {
        "POST /api/flows/onboarding/agent-onboarding":
          "Create wallet + policy + agent in one step",
        "POST /api/flows/onboarding/multi-agent-setup":
          "Create wallet with multiple agents and policies",
      },
      payment: {
        "POST /api/flows/payment/x402-simulation":
          "Simulate x402 payment flow with multiple API calls",
        "POST /api/flows/payment/budget-exhaustion":
          "Test budget limits by making payments until exhaustion",
      },
      lifecycle: {
        "POST /api/flows/lifecycle/agent-lifecycle":
          "Full agent lifecycle: create, use, revoke",
        "POST /api/flows/lifecycle/policy-update":
          "Create agent, use under policy, update policy, use again",
        "POST /api/flows/lifecycle/cleanup":
          "Delete all wallets, agents, and policies",
      },
      scenarios: {
        "POST /api/flows/scenarios/defi-trading-bot":
          "Simulate a DeFi trading bot with trades across pairs",
        "POST /api/flows/scenarios/api-marketplace-consumer":
          "Simulate an agent consuming multiple paid APIs via x402",
        "POST /api/flows/scenarios/multi-chain-operations":
          "Set up wallets and agents across multiple chains",
      },
    },
  });
});

console.log(`Sigloop REST API starting on port ${PORT}`);
console.log(`Backend URL: ${BACKEND_URL}`);

serve({ fetch: app.fetch, port: PORT }, () => {
  console.log(`Sigloop REST API running at http://localhost:${PORT}`);
});

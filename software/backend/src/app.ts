import { Hono } from "hono"
import type { Config } from "./config.js"
import { createCorsMiddleware } from "./middleware/cors.js"
import { errorHandler } from "./middleware/error-handler.js"
import { createAuthMiddleware } from "./middleware/auth.js"
import { createRateLimitMiddleware } from "./middleware/rate-limit.js"
import { createWalletsStore } from "./stores/wallets.js"
import { createAgentsStore } from "./stores/agents.js"
import { createPoliciesStore } from "./stores/policies.js"
import { createPaymentsStore } from "./stores/payments.js"
import { createEventsStore } from "./stores/events.js"
import { createKeysService } from "./services/keys.js"
import { createWalletService } from "./services/wallet.js"
import { createAgentService } from "./services/agent.js"
import { createPolicyService } from "./services/policy.js"
import { createPaymentService } from "./services/payment.js"
import { createDeFiService } from "./services/defi.js"
import { createAnalyticsService } from "./services/analytics.js"
import { createEventEmitter } from "./ws/events.js"
import { createHealthRoutes } from "./routes/health.js"
import { createWalletRoutes } from "./routes/wallets.js"
import { createAgentRoutes } from "./routes/agents.js"
import { createPolicyRoutes } from "./routes/policies.js"
import { createPaymentRoutes } from "./routes/payments.js"
import { createDeFiRoutes } from "./routes/defi.js"
import { createAnalyticsRoutes } from "./routes/analytics.js"
import { createGraphQLHandler } from "./graphql/index.js"

export function createApp(config: Config) {
  const walletsStore = createWalletsStore()
  const agentsStore = createAgentsStore()
  const policiesStore = createPoliciesStore()
  const paymentsStore = createPaymentsStore()
  const eventsStore = createEventsStore()

  const keysService = createKeysService()
  const walletService = createWalletService({ walletsStore, keysService, eventsStore, config })
  const agentService = createAgentService({ agentsStore, walletsStore, policiesStore, keysService, eventsStore })
  const policyService = createPolicyService({ policiesStore })
  const paymentService = createPaymentService({ paymentsStore, agentsStore, walletsStore, eventsStore })
  const defiService = createDeFiService()
  const analyticsService = createAnalyticsService({ paymentsStore, agentsStore })

  const eventEmitter = createEventEmitter({ eventsStore })

  const app = new Hono()

  app.use("/*", createCorsMiddleware())
  app.onError(errorHandler)

  const api = new Hono()

  api.route("/health", createHealthRoutes(config))

  api.use("/*", createRateLimitMiddleware(config))
  api.use("/*", createAuthMiddleware(config))

  api.route("/wallets", createWalletRoutes({ walletService }))
  api.route("/agents", createAgentRoutes({ agentService }))
  api.route("/policies", createPolicyRoutes({ policyService }))
  api.route("/payments", createPaymentRoutes({ paymentService }))
  api.route("/defi", createDeFiRoutes({ defiService }))
  api.route("/analytics", createAnalyticsRoutes({ analyticsService }))

  app.route("/api", api)

  app.route(
    "/graphql",
    createGraphQLHandler({
      walletService,
      agentService,
      policyService,
      paymentService,
      defiService,
      analyticsService,
    }),
  )

  return { app, eventEmitter, eventsStore, config }
}

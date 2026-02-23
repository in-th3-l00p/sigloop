import { Hono } from "hono";
import { health } from "./health.js";
import { wallets } from "./wallets.js";
import { agents } from "./agents.js";
import { policies } from "./policies.js";
import { payments } from "./payments.js";
import { analytics } from "./analytics.js";
import { authMiddleware } from "../middleware/auth.js";
import { rateLimitMiddleware } from "../middleware/ratelimit.js";

const routes = new Hono();

routes.route("/health", health);

routes.use("/*", rateLimitMiddleware);
routes.use("/*", authMiddleware);

routes.route("/wallets", wallets);
routes.route("/agents", agents);
routes.route("/policies", policies);
routes.route("/payments", payments);
routes.route("/analytics", analytics);

export { routes };

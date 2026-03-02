import { cors } from "hono/cors"
import type { MiddlewareHandler } from "hono"

export function createCorsMiddleware(): MiddlewareHandler {
  return cors({
    origin: "*",
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "X-API-KEY", "Authorization"],
    exposeHeaders: ["X-RateLimit-Limit", "X-RateLimit-Remaining"],
  })
}

import type { MiddlewareHandler } from "hono"
import type { Config } from "../config.js"

export function createAuthMiddleware(config: Config): MiddlewareHandler {
  return async (c, next) => {
    const apiKey = c.req.header("X-API-KEY")

    if (!apiKey) {
      return c.json({ error: "API key required" }, 401)
    }

    if (apiKey !== config.apiKey) {
      return c.json({ error: "Invalid API key" }, 403)
    }

    await next()
  }
}

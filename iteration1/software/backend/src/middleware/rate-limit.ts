import type { MiddlewareHandler } from "hono"
import type { Config } from "../config.js"

type Bucket = {
  tokens: number
  lastRefill: number
}

export function createRateLimitMiddleware(config: Config): MiddlewareHandler {
  const buckets = new Map<string, Bucket>()

  return async (c, next) => {
    const ip = c.req.header("x-forwarded-for") || c.req.header("x-real-ip") || "unknown"
    const now = Date.now()

    let bucket = buckets.get(ip)
    if (!bucket) {
      bucket = { tokens: config.rateLimitMaxTokens, lastRefill: now }
      buckets.set(ip, bucket)
    }

    const elapsed = (now - bucket.lastRefill) / 1000
    bucket.tokens = Math.min(
      config.rateLimitMaxTokens,
      bucket.tokens + elapsed * config.rateLimitRefillRate,
    )
    bucket.lastRefill = now

    if (bucket.tokens < 1) {
      c.header("X-RateLimit-Limit", String(config.rateLimitMaxTokens))
      c.header("X-RateLimit-Remaining", "0")
      return c.json({ error: "Rate limit exceeded" }, 429)
    }

    bucket.tokens -= 1

    c.header("X-RateLimit-Limit", String(config.rateLimitMaxTokens))
    c.header("X-RateLimit-Remaining", String(Math.floor(bucket.tokens)))

    await next()
  }
}

import type { MiddlewareHandler } from "hono";

interface TokenBucket {
  tokens: number;
  lastRefill: number;
}

const buckets = new Map<string, TokenBucket>();
const MAX_TOKENS = 100;
const REFILL_RATE = 10;
const REFILL_INTERVAL_MS = 1000;

function getClientIp(c: { req: { header: (name: string) => string | undefined } }): string {
  return (
    c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ??
    c.req.header("x-real-ip") ??
    "unknown"
  );
}

function refillBucket(bucket: TokenBucket): void {
  const now = Date.now();
  const elapsed = now - bucket.lastRefill;
  const tokensToAdd = Math.floor(elapsed / REFILL_INTERVAL_MS) * REFILL_RATE;

  if (tokensToAdd > 0) {
    bucket.tokens = Math.min(MAX_TOKENS, bucket.tokens + tokensToAdd);
    bucket.lastRefill = now;
  }
}

export const rateLimitMiddleware: MiddlewareHandler = async (c, next) => {
  const ip = getClientIp(c);

  let bucket = buckets.get(ip);
  if (!bucket) {
    bucket = { tokens: MAX_TOKENS, lastRefill: Date.now() };
    buckets.set(ip, bucket);
  }

  refillBucket(bucket);

  if (bucket.tokens <= 0) {
    return c.json(
      {
        error: "Too Many Requests",
        message: "Rate limit exceeded. Please try again later.",
        status: 429,
      },
      429
    );
  }

  bucket.tokens--;

  c.header("X-RateLimit-Limit", String(MAX_TOKENS));
  c.header("X-RateLimit-Remaining", String(bucket.tokens));

  await next();
};

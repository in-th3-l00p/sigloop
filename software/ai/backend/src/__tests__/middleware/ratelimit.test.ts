import { describe, it, expect } from "vitest";
import { Hono } from "hono";
import { rateLimitMiddleware } from "../../middleware/ratelimit.js";

function createApp(): Hono {
  const app = new Hono();
  app.use("/*", rateLimitMiddleware);
  app.get("/test", (c) => c.json({ ok: true }));
  return app;
}

describe("rateLimitMiddleware", () => {
  it("allows requests within rate limit", async () => {
    const app = createApp();
    const res = await app.request("/test", {
      headers: { "x-forwarded-for": `ratelimit-test-${Date.now()}-ok` },
    });
    expect(res.status).toBe(200);
  });

  it("sets rate limit headers", async () => {
    const app = createApp();
    const ip = `ratelimit-test-${Date.now()}-headers`;
    const res = await app.request("/test", {
      headers: { "x-forwarded-for": ip },
    });
    expect(res.headers.get("X-RateLimit-Limit")).toBe("100");
    expect(res.headers.get("X-RateLimit-Remaining")).toBeTruthy();
  });

  it("returns 429 when rate limit is exceeded", async () => {
    const app = createApp();
    const ip = `ratelimit-test-${Date.now()}-exceed`;

    for (let i = 0; i < 100; i++) {
      await app.request("/test", {
        headers: { "x-forwarded-for": ip },
      });
    }

    const res = await app.request("/test", {
      headers: { "x-forwarded-for": ip },
    });
    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.error).toBe("Too Many Requests");
  });

  it("decrements remaining tokens on each request", async () => {
    const app = createApp();
    const ip = `ratelimit-test-${Date.now()}-decrement`;

    const res1 = await app.request("/test", {
      headers: { "x-forwarded-for": ip },
    });
    const remaining1 = parseInt(res1.headers.get("X-RateLimit-Remaining")!, 10);

    const res2 = await app.request("/test", {
      headers: { "x-forwarded-for": ip },
    });
    const remaining2 = parseInt(res2.headers.get("X-RateLimit-Remaining")!, 10);

    expect(remaining2).toBe(remaining1 - 1);
  });

  it("uses x-real-ip when x-forwarded-for is absent", async () => {
    const app = createApp();
    const ip = `ratelimit-test-${Date.now()}-realip`;
    const res = await app.request("/test", {
      headers: { "x-real-ip": ip },
    });
    expect(res.status).toBe(200);
  });

  it("uses 'unknown' when no ip headers are present", async () => {
    const app = createApp();
    const res = await app.request("/test");
    expect(res.status).toBe(200);
  });
});

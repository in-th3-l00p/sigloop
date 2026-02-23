import { describe, it, expect } from "vitest";
import { Hono } from "hono";
import { authMiddleware } from "../../middleware/auth.js";

function createApp(): Hono {
  const app = new Hono();
  app.use("/*", authMiddleware);
  app.get("/test", (c) => c.json({ ok: true }));
  return app;
}

describe("authMiddleware", () => {
  it("returns 401 when X-API-KEY header is missing", async () => {
    const app = createApp();
    const res = await app.request("/test");
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Unauthorized");
    expect(body.message).toBe("Missing X-API-KEY header");
  });

  it("returns 403 when X-API-KEY is invalid", async () => {
    const app = createApp();
    const res = await app.request("/test", {
      headers: { "X-API-KEY": "wrong-key" },
    });
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe("Forbidden");
    expect(body.message).toBe("Invalid API key");
  });

  it("passes through when X-API-KEY is valid", async () => {
    const app = createApp();
    const res = await app.request("/test", {
      headers: { "X-API-KEY": "sigloop-dev-key" },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });
});

import { describe, it, expect } from "vitest";
import { Hono } from "hono";
import { health } from "../../routes/health.js";

function createApp(): Hono {
  const app = new Hono();
  app.route("/api/health", health);
  return app;
}

describe("health route", () => {
  it("GET /api/health returns status ok", async () => {
    const app = createApp();
    const res = await app.request("/api/health");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("ok");
    expect(body.version).toBe("0.1.0");
    expect(body.timestamp).toBeTruthy();
  });
});

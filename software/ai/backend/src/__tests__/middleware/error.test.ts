import { describe, it, expect } from "vitest";
import { Hono } from "hono";
import { errorHandler } from "../../middleware/error.js";

function createApp(errorMessage: string): Hono {
  const app = new Hono();
  app.onError(errorHandler);
  app.get("/test", () => {
    throw new Error(errorMessage);
  });
  return app;
}

describe("errorHandler", () => {
  it("returns 404 for 'not found' errors", async () => {
    const app = createApp("Wallet not found: xyz");
    const res = await app.request("/test");
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe("Not Found");
    expect(body.message).toBe("Wallet not found: xyz");
    expect(body.status).toBe(404);
  });

  it("returns 400 for 'required' errors", async () => {
    const app = createApp("Wallet name is required");
    const res = await app.request("/test");
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Bad Request");
  });

  it("returns 400 for 'must be' errors", async () => {
    const app = createApp("amount must be a positive number");
    const res = await app.request("/test");
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Bad Request");
  });

  it("returns 400 for 'Invalid' errors", async () => {
    const app = createApp("Invalid rule type: bad");
    const res = await app.request("/test");
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Bad Request");
  });

  it("returns 409 for 'already' errors", async () => {
    const app = createApp("Agent is already revoked: abc");
    const res = await app.request("/test");
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toBe("Conflict");
  });

  it("returns 500 for unknown errors", async () => {
    const app = createApp("Something went wrong");
    const res = await app.request("/test");
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("Internal Server Error");
    expect(body.message).toBe("Something went wrong");
  });

  it("returns 500 with default message when error has no message", async () => {
    const app = new Hono();
    app.onError(errorHandler);
    app.get("/test", () => {
      throw new Error("");
    });
    const res = await app.request("/test");
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("Internal Server Error");
  });
});

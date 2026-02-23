import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import { errorHandler } from "../middleware/error.js";
import { requestLogger } from "../middleware/logger.js";
import type { Context } from "hono";

describe("errorHandler", () => {
  it("passes through successful responses", async () => {
    const app = new Hono();
    app.use("*", errorHandler);
    app.get("/ok", (c) => c.json({ message: "success" }));
    const res = await app.request("/ok");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ message: "success" });
  });

  it("catches Error and returns 500 with message", async () => {
    let capturedContext: Context | null = null;

    const mockNext = vi.fn().mockRejectedValue(new Error("something broke"));
    const mockJson = vi.fn().mockReturnValue(new Response());

    const mockCtx = {
      json: mockJson,
    } as unknown as Context;

    await errorHandler(mockCtx, mockNext);

    expect(mockJson).toHaveBeenCalledWith(
      { error: "something broke" },
      500
    );
  });

  it("returns 404 when error message includes 'not found'", async () => {
    const mockNext = vi.fn().mockRejectedValue(new Error("resource not found"));
    const mockJson = vi.fn().mockReturnValue(new Response());
    const mockCtx = { json: mockJson } as unknown as Context;

    await errorHandler(mockCtx, mockNext);

    expect(mockJson).toHaveBeenCalledWith(
      { error: "resource not found" },
      404
    );
  });

  it("handles non-Error thrown values with generic message", async () => {
    const mockNext = vi.fn().mockRejectedValue("string error");
    const mockJson = vi.fn().mockReturnValue(new Response());
    const mockCtx = { json: mockJson } as unknown as Context;

    await errorHandler(mockCtx, mockNext);

    expect(mockJson).toHaveBeenCalledWith(
      { error: "Internal server error" },
      500
    );
  });

  it("returns 404 for 'not found' in any position of the message", async () => {
    const mockNext = vi
      .fn()
      .mockRejectedValue(new Error("wallet not found in database"));
    const mockJson = vi.fn().mockReturnValue(new Response());
    const mockCtx = { json: mockJson } as unknown as Context;

    await errorHandler(mockCtx, mockNext);

    expect(mockJson).toHaveBeenCalledWith(
      { error: "wallet not found in database" },
      404
    );
  });

  it("calls next and does not call json on success", async () => {
    const mockNext = vi.fn().mockResolvedValue(undefined);
    const mockJson = vi.fn();
    const mockCtx = { json: mockJson } as unknown as Context;

    await errorHandler(mockCtx, mockNext);

    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(mockJson).not.toHaveBeenCalled();
  });
});

describe("requestLogger", () => {
  let app: Hono;

  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    app = new Hono();
    app.use("*", requestLogger);
  });

  it("logs method, path, status, and duration", async () => {
    app.get("/test", (c) => c.json({ ok: true }));
    await app.request("/test");
    expect(console.log).toHaveBeenCalledWith(
      expect.stringMatching(/^GET \/test 200 \d+ms$/)
    );
  });

  it("logs POST requests", async () => {
    app.post("/create", (c) => c.json({ created: true }, 201));
    await app.request("/create", { method: "POST" });
    expect(console.log).toHaveBeenCalledWith(
      expect.stringMatching(/^POST \/create 201 \d+ms$/)
    );
  });

  it("logs even when downstream returns error status", async () => {
    app.get("/err", (c) => c.json({ error: "bad" }, 400));
    await app.request("/err");
    expect(console.log).toHaveBeenCalledWith(
      expect.stringMatching(/^GET \/err 400 \d+ms$/)
    );
  });
});

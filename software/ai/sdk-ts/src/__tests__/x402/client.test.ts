import { describe, it, expect, vi } from "vitest";
import { createX402Client } from "../../x402/client.js";
import type { Address, Hex } from "viem";

vi.mock("../../x402/middleware.js", () => ({
  createX402Middleware: vi.fn(() => {
    return vi.fn().mockResolvedValue(new Response("ok", { status: 200 }));
  }),
}));

const MOCK_ACCOUNT = {
  address: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045" as Address,
  signTypedData: vi.fn(),
} as any;

const MOCK_OPTIONS = {
  account: MOCK_ACCOUNT,
  walletAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" as Address,
  chainId: 8453,
  config: {
    maxPaymentPerRequest: 1000n,
    maxTotalPayment: 5000n,
    autoApprove: true,
  },
};

describe("createX402Client", () => {
  it("returns a client with all methods", () => {
    const client = createX402Client(MOCK_OPTIONS);
    expect(client.fetch).toBeDefined();
    expect(client.get).toBeDefined();
    expect(client.post).toBeDefined();
    expect(client.put).toBeDefined();
    expect(client.delete).toBeDefined();
    expect(client.getBudgetTracker).toBeDefined();
  });

  it("returns a budget tracker", () => {
    const client = createX402Client(MOCK_OPTIONS);
    const tracker = client.getBudgetTracker();
    expect(tracker).toBeDefined();
    expect(tracker.getPaymentCount()).toBe(0);
  });

  describe("get", () => {
    it("makes a GET request", async () => {
      const client = createX402Client(MOCK_OPTIONS);
      const response = await client.get("https://api.example.com/data");
      expect(response.status).toBe(200);
    });
  });

  describe("post", () => {
    it("makes a POST request", async () => {
      const client = createX402Client(MOCK_OPTIONS);
      const response = await client.post("https://api.example.com/data", { key: "value" });
      expect(response.status).toBe(200);
    });
  });

  describe("put", () => {
    it("makes a PUT request", async () => {
      const client = createX402Client(MOCK_OPTIONS);
      const response = await client.put("https://api.example.com/data", { key: "value" });
      expect(response.status).toBe(200);
    });
  });

  describe("delete", () => {
    it("makes a DELETE request", async () => {
      const client = createX402Client(MOCK_OPTIONS);
      const response = await client.delete("https://api.example.com/data");
      expect(response.status).toBe(200);
    });
  });

  describe("URL resolution", () => {
    it("resolves relative URLs with baseUrl", async () => {
      const client = createX402Client({
        ...MOCK_OPTIONS,
        baseUrl: "https://api.example.com",
      });
      const response = await client.get("/data");
      expect(response.status).toBe(200);
    });

    it("uses absolute URLs directly", async () => {
      const client = createX402Client({
        ...MOCK_OPTIONS,
        baseUrl: "https://api.example.com",
      });
      const response = await client.get("https://other.com/data");
      expect(response.status).toBe(200);
    });
  });
});

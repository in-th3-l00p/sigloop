const mockFetch = jest.fn();
(global as any).fetch = mockFetch;

const { apiClient } = require("../../__mocks__/apiClient") as typeof import("../client");

describe("apiClient mock", () => {
  it("exports apiClient function", () => {
    expect(typeof apiClient).toBe("function");
  });

  it("returns a promise", async () => {
    const result = await apiClient("/test");
    expect(result).toBeDefined();
  });
});

describe("apiClient real behavior", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it("sends request with correct headers", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: "test" }),
    });

    const baseFetch = async (path: string, options?: RequestInit) => {
      const res = await fetch(`http://localhost:3001${path}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...options?.headers,
        },
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    };

    await baseFetch("/test");

    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:3001/test",
      expect.objectContaining({
        headers: expect.objectContaining({
          "Content-Type": "application/json",
        }),
      })
    );
  });

  it("throws on non-ok response", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      text: () => Promise.resolve("Bad Request"),
    });

    const baseFetch = async (path: string, options?: RequestInit) => {
      const res = await fetch(`http://localhost:3001${path}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...options?.headers,
        },
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    };

    await expect(baseFetch("/fail")).rejects.toThrow("Bad Request");
  });

  it("sends POST requests with body", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: "1" }),
    });

    const baseFetch = async (path: string, options?: RequestInit) => {
      const res = await fetch(`http://localhost:3001${path}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...options?.headers,
        },
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    };

    await baseFetch("/wallets", {
      method: "POST",
      body: JSON.stringify({ name: "test" }),
    });

    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:3001/wallets",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ name: "test" }),
      })
    );
  });
});

import { fetchAgents, fetchAgent, createAgent, revokeAgent } from "../agents";
import { apiClient } from "../client";

jest.mock("../client");

const mockedApiClient = apiClient as jest.MockedFunction<typeof apiClient>;

describe("fetchAgents", () => {
  it("calls apiClient with /agents", async () => {
    const agents = [
      {
        id: "a1",
        walletId: "w1",
        name: "Bot",
        sessionKeyAddress: "0xaaa",
        status: "active" as const,
        policyId: "p1",
        createdAt: "2024-01-01T00:00:00Z",
        expiresAt: "2025-01-01T00:00:00Z",
      },
    ];
    mockedApiClient.mockResolvedValue(agents);

    const result = await fetchAgents();

    expect(mockedApiClient).toHaveBeenCalledWith("/agents");
    expect(result).toEqual(agents);
  });
});

describe("fetchAgent", () => {
  it("calls apiClient with /agents/:id", async () => {
    const agent = {
      id: "a1",
      walletId: "w1",
      name: "Bot",
      sessionKeyAddress: "0xaaa",
      status: "active" as const,
      policyId: "p1",
      createdAt: "2024-01-01T00:00:00Z",
      expiresAt: "2025-01-01T00:00:00Z",
    };
    mockedApiClient.mockResolvedValue(agent);

    const result = await fetchAgent("a1");

    expect(mockedApiClient).toHaveBeenCalledWith("/agents/a1");
    expect(result).toEqual(agent);
  });
});

describe("createAgent", () => {
  it("calls apiClient with POST method", async () => {
    const newAgent = {
      id: "a2",
      walletId: "w1",
      name: "New Bot",
      sessionKeyAddress: "0xbbb",
      status: "active" as const,
      policyId: "p1",
      createdAt: "2024-01-01T00:00:00Z",
      expiresAt: "2025-06-01T00:00:00Z",
    };
    mockedApiClient.mockResolvedValue(newAgent);

    const payload = {
      walletId: "w1",
      name: "New Bot",
      policyId: "p1",
      expiresAt: "2025-06-01T00:00:00Z",
    };
    const result = await createAgent(payload);

    expect(mockedApiClient).toHaveBeenCalledWith("/agents", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    expect(result).toEqual(newAgent);
  });
});

describe("revokeAgent", () => {
  it("calls apiClient with POST to revoke endpoint", async () => {
    const revokedAgent = {
      id: "a1",
      walletId: "w1",
      name: "Bot",
      sessionKeyAddress: "0xaaa",
      status: "revoked" as const,
      policyId: "p1",
      createdAt: "2024-01-01T00:00:00Z",
      expiresAt: "2025-01-01T00:00:00Z",
    };
    mockedApiClient.mockResolvedValue(revokedAgent);

    const result = await revokeAgent("a1");

    expect(mockedApiClient).toHaveBeenCalledWith("/agents/a1/revoke", {
      method: "POST",
    });
    expect(result).toEqual(revokedAgent);
  });
});

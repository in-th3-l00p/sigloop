import { fetchPolicies, fetchPolicy, createPolicy, deletePolicy } from "../policies";
import { apiClient } from "../client";

jest.mock("../client");

const mockedApiClient = apiClient as jest.MockedFunction<typeof apiClient>;

describe("fetchPolicies", () => {
  it("calls apiClient with /policies", async () => {
    const policies = [
      {
        id: "p1",
        name: "Default",
        spending: { maxPerTx: "0.1", dailyLimit: "1.0", weeklyLimit: "5.0" },
        allowlist: { contracts: [], functions: [] },
        timeWindow: { validAfter: "", validUntil: "" },
        createdAt: "2024-01-01T00:00:00Z",
      },
    ];
    mockedApiClient.mockResolvedValue(policies);

    const result = await fetchPolicies();

    expect(mockedApiClient).toHaveBeenCalledWith("/policies");
    expect(result).toEqual(policies);
  });
});

describe("fetchPolicy", () => {
  it("calls apiClient with /policies/:id", async () => {
    const policy = {
      id: "p1",
      name: "Default",
      spending: { maxPerTx: "0.1", dailyLimit: "1.0", weeklyLimit: "5.0" },
      allowlist: { contracts: ["0xabc"], functions: ["transfer"] },
      timeWindow: { validAfter: "", validUntil: "" },
      createdAt: "2024-01-01T00:00:00Z",
    };
    mockedApiClient.mockResolvedValue(policy);

    const result = await fetchPolicy("p1");

    expect(mockedApiClient).toHaveBeenCalledWith("/policies/p1");
    expect(result).toEqual(policy);
  });
});

describe("createPolicy", () => {
  it("calls apiClient with POST method", async () => {
    const newPolicy = {
      id: "p2",
      name: "Strict",
      spending: { maxPerTx: "0.01", dailyLimit: "0.1", weeklyLimit: "0.5" },
      allowlist: { contracts: [], functions: [] },
      timeWindow: { validAfter: "", validUntil: "" },
      createdAt: "2024-01-02T00:00:00Z",
    };
    mockedApiClient.mockResolvedValue(newPolicy);

    const payload = {
      name: "Strict",
      spending: { maxPerTx: "0.01", dailyLimit: "0.1", weeklyLimit: "0.5" },
      allowlist: { contracts: [], functions: [] },
      timeWindow: { validAfter: "", validUntil: "" },
    };
    const result = await createPolicy(payload);

    expect(mockedApiClient).toHaveBeenCalledWith("/policies", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    expect(result).toEqual(newPolicy);
  });
});

describe("deletePolicy", () => {
  it("calls apiClient with DELETE method", async () => {
    mockedApiClient.mockResolvedValue(undefined);

    await deletePolicy("p1");

    expect(mockedApiClient).toHaveBeenCalledWith("/policies/p1", {
      method: "DELETE",
    });
  });
});

import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { usePolicies, useCreatePolicy } from "../usePolicy";
import * as policyApi from "../../api/policies";

jest.mock("../../api/policies");

const mockedApi = policyApi as jest.Mocked<typeof policyApi>;

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
}

describe("usePolicies", () => {
  it("returns policies from API", async () => {
    const policies = [
      {
        id: "p1",
        name: "Default Policy",
        spending: { maxPerTx: "0.1", dailyLimit: "1.0", weeklyLimit: "5.0" },
        allowlist: { contracts: ["0xabc"], functions: ["transfer"] },
        timeWindow: { validAfter: "", validUntil: "" },
        createdAt: "2024-01-01T00:00:00Z",
      },
    ];
    mockedApi.fetchPolicies.mockResolvedValue(policies);

    const { result } = renderHook(() => usePolicies(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(policies);
  });
});

describe("useCreatePolicy", () => {
  it("calls createPolicy API", async () => {
    const newPolicy = {
      id: "p2",
      name: "Strict Policy",
      spending: { maxPerTx: "0.01", dailyLimit: "0.1", weeklyLimit: "0.5" },
      allowlist: { contracts: [], functions: [] },
      timeWindow: { validAfter: "", validUntil: "" },
      createdAt: "2024-01-02T00:00:00Z",
    };
    mockedApi.createPolicy.mockResolvedValue(newPolicy);

    const { result } = renderHook(() => useCreatePolicy(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      name: "Strict Policy",
      spending: { maxPerTx: "0.01", dailyLimit: "0.1", weeklyLimit: "0.5" },
      allowlist: { contracts: [], functions: [] },
      timeWindow: { validAfter: "", validUntil: "" },
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});

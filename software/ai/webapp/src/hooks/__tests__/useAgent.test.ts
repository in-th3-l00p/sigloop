import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { useAgents, useRevokeAgent } from "../useAgent";
import * as agentApi from "../../api/agents";

jest.mock("../../api/agents");

const mockedApi = agentApi as jest.Mocked<typeof agentApi>;

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
}

describe("useAgents", () => {
  it("returns agents from API", async () => {
    const agents = [
      {
        id: "a1",
        walletId: "w1",
        name: "Payment Bot",
        sessionKeyAddress: "0xaaaa",
        status: "active" as const,
        policyId: "p1",
        createdAt: "2024-01-01T00:00:00Z",
        expiresAt: "2025-01-01T00:00:00Z",
      },
    ];
    mockedApi.fetchAgents.mockResolvedValue(agents);

    const { result } = renderHook(() => useAgents(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(agents);
  });
});

describe("useRevokeAgent", () => {
  it("calls revokeAgent API", async () => {
    const revokedAgent = {
      id: "a1",
      walletId: "w1",
      name: "Payment Bot",
      sessionKeyAddress: "0xaaaa",
      status: "revoked" as const,
      policyId: "p1",
      createdAt: "2024-01-01T00:00:00Z",
      expiresAt: "2025-01-01T00:00:00Z",
    };
    mockedApi.revokeAgent.mockResolvedValue(revokedAgent);

    const { result } = renderHook(() => useRevokeAgent(), {
      wrapper: createWrapper(),
    });

    result.current.mutate("a1");

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedApi.revokeAgent).toHaveBeenCalledWith("a1");
  });
});

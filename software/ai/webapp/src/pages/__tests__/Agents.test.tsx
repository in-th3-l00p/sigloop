import { render, screen } from "@testing-library/react";
import { createElement } from "react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Agents } from "../Agents";

jest.mock("@/hooks/useAgent", () => ({
  useAgents: () => ({
    data: [
      {
        id: "a1",
        walletId: "w1",
        name: "Payment Bot",
        sessionKeyAddress: "0xaaaa000000000000000000000000000000001111",
        status: "active" as const,
        policyId: "p1",
        createdAt: "2024-01-01T00:00:00Z",
        expiresAt: "2025-01-01T00:00:00Z",
      },
      {
        id: "a2",
        walletId: "w1",
        name: "Data Bot",
        sessionKeyAddress: "0xbbbb000000000000000000000000000000002222",
        status: "revoked" as const,
        policyId: "p2",
        createdAt: "2024-02-01T00:00:00Z",
        expiresAt: "2025-02-01T00:00:00Z",
      },
    ],
    isLoading: false,
  }),
  useCreateAgent: () => ({
    mutate: jest.fn(),
    isPending: false,
  }),
}));

jest.mock("@/hooks/useWallet", () => ({
  useWallets: () => ({ data: [] }),
}));

jest.mock("@/hooks/usePolicy", () => ({
  usePolicies: () => ({ data: [] }),
}));

function renderAgents() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    createElement(
      QueryClientProvider,
      { client: queryClient },
      createElement(MemoryRouter, null, createElement(Agents))
    )
  );
}

describe("Agents", () => {
  it("renders Agents header", () => {
    renderAgents();
    expect(screen.getByText("Agents")).toBeInTheDocument();
  });

  it("renders Create Agent button", () => {
    renderAgents();
    expect(screen.getByText("Create Agent")).toBeInTheDocument();
  });

  it("renders filter tabs", () => {
    renderAgents();
    expect(screen.getByText("All")).toBeInTheDocument();
    expect(screen.getAllByText("Active").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Revoked").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Expired")).toBeInTheDocument();
  });

  it("renders agent list", () => {
    renderAgents();
    expect(screen.getByText("Payment Bot")).toBeInTheDocument();
    expect(screen.getByText("Data Bot")).toBeInTheDocument();
  });

  it("renders agent status badges", () => {
    renderAgents();
    expect(screen.getAllByText("Active").length).toBeGreaterThanOrEqual(1);
  });
});

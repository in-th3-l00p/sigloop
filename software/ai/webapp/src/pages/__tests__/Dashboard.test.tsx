import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Dashboard } from "../Dashboard";

jest.mock("@/hooks/useWallet", () => ({
  useWallets: () => ({
    data: [
      {
        id: "w1",
        address: "0x1234567890abcdef1234567890abcdef12345678",
        name: "Test Wallet",
        chainId: 8453,
        agentCount: 2,
        totalSpent: "1.0",
        createdAt: "2024-01-01T00:00:00Z",
      },
    ],
  }),
}));

jest.mock("@/hooks/useAgent", () => ({
  useAgents: () => ({
    data: [
      {
        id: "a1",
        walletId: "w1",
        name: "Agent One",
        sessionKeyAddress: "0xaaaa000000000000000000000000000000001111",
        status: "active" as const,
        policyId: "p1",
        createdAt: "2024-01-01T00:00:00Z",
        expiresAt: "2025-01-01T00:00:00Z",
      },
    ],
  }),
}));

jest.mock("@/hooks/usePolicy", () => ({
  usePolicies: () => ({
    data: [
      {
        id: "p1",
        name: "Default",
        spending: { maxPerTx: "0.1", dailyLimit: "1.0", weeklyLimit: "5.0" },
        allowlist: { contracts: [], functions: [] },
        timeWindow: { validAfter: "", validUntil: "" },
        createdAt: "2024-01-01T00:00:00Z",
      },
    ],
  }),
}));

jest.mock("@/hooks/useX402", () => ({
  usePayments: () => ({
    data: [
      {
        id: "pay1",
        agentId: "a1",
        agentName: "Agent One",
        domain: "api.example.com",
        amount: "0.001",
        status: "settled" as const,
        timestamp: "2024-06-15T10:30:00Z",
      },
    ],
  }),
  usePaymentStats: () => ({
    data: {
      totalSpent: "1.5",
      totalPayments: 42,
      avgPerPayment: "0.036",
      topDomains: [{ domain: "api.example.com", amount: "0.8" }],
    },
  }),
}));

function renderDashboard() {
  return render(
    <MemoryRouter>
      <Dashboard />
    </MemoryRouter>
  );
}

describe("Dashboard", () => {
  it("renders Dashboard header", () => {
    renderDashboard();
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
  });

  it("renders Wallets stat card", () => {
    renderDashboard();
    expect(screen.getByText("Wallets")).toBeInTheDocument();
  });

  it("renders Agents stat card", () => {
    renderDashboard();
    expect(screen.getByText("Agents")).toBeInTheDocument();
  });

  it("renders Policies stat card", () => {
    renderDashboard();
    expect(screen.getByText("Policies")).toBeInTheDocument();
  });

  it("renders Total x402 Spend stat card", () => {
    renderDashboard();
    expect(screen.getByText("Total x402 Spend")).toBeInTheDocument();
  });

  it("renders stat card values", () => {
    renderDashboard();
    const allValues = screen.getAllByText("1");
    expect(allValues.length).toBeGreaterThanOrEqual(1);
  });

  it("renders total spend value", () => {
    renderDashboard();
    expect(screen.getByText("1.5 ETH")).toBeInTheDocument();
  });

  it("renders Recent Payments section", () => {
    renderDashboard();
    expect(screen.getByText("Recent Payments")).toBeInTheDocument();
  });

  it("renders Recent Agents section", () => {
    renderDashboard();
    expect(screen.getByText("Recent Agents")).toBeInTheDocument();
  });

  it("renders agent name in recent agents", () => {
    renderDashboard();
    expect(screen.getAllByText("Agent One").length).toBeGreaterThanOrEqual(1);
  });

  it("renders payment data", () => {
    renderDashboard();
    expect(screen.getByText("api.example.com")).toBeInTheDocument();
  });
});

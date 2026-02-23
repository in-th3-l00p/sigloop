import { render, screen } from "@testing-library/react";
import { PaymentStats } from "../payment/PaymentStats";
import type { PaymentStats as PaymentStatsType } from "@/types";

const mockStats: PaymentStatsType = {
  totalSpent: "1.5",
  totalPayments: 42,
  avgPerPayment: "0.036",
  topDomains: [
    { domain: "api.example.com", amount: "0.8" },
    { domain: "data.service.io", amount: "0.5" },
  ],
};

describe("PaymentStats", () => {
  it("renders Total Spent card", () => {
    render(<PaymentStats stats={mockStats} />);
    expect(screen.getByText("Total Spent")).toBeInTheDocument();
    expect(screen.getByText("1.5 ETH")).toBeInTheDocument();
  });

  it("renders Total Payments card", () => {
    render(<PaymentStats stats={mockStats} />);
    expect(screen.getByText("Total Payments")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("renders Avg Per Payment card", () => {
    render(<PaymentStats stats={mockStats} />);
    expect(screen.getByText("Avg Per Payment")).toBeInTheDocument();
    expect(screen.getByText("0.036 ETH")).toBeInTheDocument();
  });

  it("renders Top Domain card", () => {
    render(<PaymentStats stats={mockStats} />);
    expect(screen.getByText("Top Domain")).toBeInTheDocument();
    expect(screen.getByText("api.example.com")).toBeInTheDocument();
  });

  it("renders top domain amount", () => {
    render(<PaymentStats stats={mockStats} />);
    expect(screen.getByText("0.8 ETH")).toBeInTheDocument();
  });

  it("renders N/A when no top domains", () => {
    const statsNoDomains: PaymentStatsType = {
      ...mockStats,
      topDomains: [],
    };
    render(<PaymentStats stats={statsNoDomains} />);
    expect(screen.getByText("N/A")).toBeInTheDocument();
  });
});

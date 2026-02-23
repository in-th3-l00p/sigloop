import { render, screen } from "@testing-library/react";
import { PaymentTable } from "../payment/PaymentTable";
import type { Payment } from "@/types";

const mockPayments: Payment[] = [
  {
    id: "pay1",
    agentId: "a1",
    agentName: "Bot Alpha",
    domain: "api.example.com",
    amount: "0.001",
    status: "settled",
    timestamp: "2024-06-15T10:30:00Z",
  },
  {
    id: "pay2",
    agentId: "a2",
    agentName: "Bot Beta",
    domain: "data.service.io",
    amount: "0.005",
    status: "pending",
    timestamp: "2024-06-15T11:00:00Z",
  },
  {
    id: "pay3",
    agentId: "a1",
    agentName: "Bot Alpha",
    domain: "compute.api.dev",
    amount: "0.01",
    status: "failed",
    timestamp: "2024-06-15T12:00:00Z",
  },
];

describe("PaymentTable", () => {
  it("renders table headers", () => {
    render(<PaymentTable payments={mockPayments} />);
    expect(screen.getByText("Time")).toBeInTheDocument();
    expect(screen.getByText("Agent")).toBeInTheDocument();
    expect(screen.getByText("Domain")).toBeInTheDocument();
    expect(screen.getByText("Amount")).toBeInTheDocument();
    expect(screen.getByText("Status")).toBeInTheDocument();
  });

  it("renders payment rows", () => {
    render(<PaymentTable payments={mockPayments} />);
    expect(screen.getAllByText("Bot Alpha").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Bot Beta")).toBeInTheDocument();
  });

  it("renders agent names", () => {
    render(<PaymentTable payments={mockPayments} />);
    expect(screen.getAllByText("Bot Alpha")).toHaveLength(2);
    expect(screen.getByText("Bot Beta")).toBeInTheDocument();
  });

  it("renders domains", () => {
    render(<PaymentTable payments={mockPayments} />);
    expect(screen.getByText("api.example.com")).toBeInTheDocument();
    expect(screen.getByText("data.service.io")).toBeInTheDocument();
    expect(screen.getByText("compute.api.dev")).toBeInTheDocument();
  });

  it("renders amounts with ETH suffix", () => {
    render(<PaymentTable payments={mockPayments} />);
    expect(screen.getByText("0.001 ETH")).toBeInTheDocument();
    expect(screen.getByText("0.005 ETH")).toBeInTheDocument();
    expect(screen.getByText("0.01 ETH")).toBeInTheDocument();
  });

  it("renders status badges", () => {
    render(<PaymentTable payments={mockPayments} />);
    expect(screen.getByText("settled")).toBeInTheDocument();
    expect(screen.getByText("pending")).toBeInTheDocument();
    expect(screen.getByText("failed")).toBeInTheDocument();
  });

  it("renders empty state when no payments", () => {
    render(<PaymentTable payments={[]} />);
    expect(screen.getByText("No payments recorded yet")).toBeInTheDocument();
  });

  it("renders timestamps", () => {
    render(<PaymentTable payments={[mockPayments[0]]} />);
    const timestamp = new Date("2024-06-15T10:30:00Z").toLocaleString();
    expect(screen.getByText(timestamp)).toBeInTheDocument();
  });
});

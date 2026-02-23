import { render, screen } from "@testing-library/react";
import { AgentCard } from "../agent/AgentCard";
import type { Agent } from "@/types";

const mockAgent: Agent = {
  id: "a1",
  walletId: "w1",
  name: "Payment Bot",
  sessionKeyAddress: "0xabcdef1234567890abcdef1234567890abcdef12",
  status: "active",
  policyId: "pol-12345678-abcd-1234-abcd-1234567890ab",
  createdAt: "2024-01-01T00:00:00Z",
  expiresAt: "2025-06-15T00:00:00Z",
};

describe("AgentCard", () => {
  it("renders agent name", () => {
    render(<AgentCard agent={mockAgent} />);
    expect(screen.getByText("Payment Bot")).toBeInTheDocument();
  });

  it("renders status badge", () => {
    render(<AgentCard agent={mockAgent} />);
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("renders revoked status badge", () => {
    render(<AgentCard agent={{ ...mockAgent, status: "revoked" }} />);
    expect(screen.getByText("Revoked")).toBeInTheDocument();
  });

  it("renders expired status badge", () => {
    render(<AgentCard agent={{ ...mockAgent, status: "expired" }} />);
    expect(screen.getByText("Expired")).toBeInTheDocument();
  });

  it("renders truncated session key address", () => {
    render(<AgentCard agent={mockAgent} />);
    expect(screen.getByText("0xabcd...ef12")).toBeInTheDocument();
  });

  it("renders truncated policy ID", () => {
    render(<AgentCard agent={mockAgent} />);
    expect(screen.getByText("Policy: pol-1234...")).toBeInTheDocument();
  });

  it("renders expiry date", () => {
    render(<AgentCard agent={mockAgent} />);
    const expiryDate = new Date("2025-06-15T00:00:00Z").toLocaleDateString();
    expect(screen.getByText(`Expires: ${expiryDate}`)).toBeInTheDocument();
  });
});

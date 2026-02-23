import { render, screen, fireEvent } from "@testing-library/react";
import { AgentList } from "../agent/AgentList";
import type { Agent } from "@/types";

const mockAgents: Agent[] = [
  {
    id: "a1",
    walletId: "w1",
    name: "Agent Alpha",
    sessionKeyAddress: "0x1111111111111111111111111111111111111111",
    status: "active",
    policyId: "p1",
    createdAt: "2024-01-01T00:00:00Z",
    expiresAt: "2025-01-01T00:00:00Z",
  },
  {
    id: "a2",
    walletId: "w1",
    name: "Agent Beta",
    sessionKeyAddress: "0x2222222222222222222222222222222222222222",
    status: "revoked",
    policyId: "p2",
    createdAt: "2024-02-01T00:00:00Z",
    expiresAt: "2025-02-01T00:00:00Z",
  },
];

describe("AgentList", () => {
  it("renders agent cards when agents exist", () => {
    render(<AgentList agents={mockAgents} onCreateNew={jest.fn()} />);
    expect(screen.getByText("Agent Alpha")).toBeInTheDocument();
    expect(screen.getByText("Agent Beta")).toBeInTheDocument();
  });

  it("renders empty state when no agents", () => {
    render(<AgentList agents={[]} onCreateNew={jest.fn()} />);
    expect(screen.getByText("No agents found")).toBeInTheDocument();
  });

  it("renders empty state description", () => {
    render(<AgentList agents={[]} onCreateNew={jest.fn()} />);
    expect(
      screen.getByText(
        "Create an agent and assign it a session key with scoped permissions."
      )
    ).toBeInTheDocument();
  });

  it("renders Create Agent button in empty state", () => {
    render(<AgentList agents={[]} onCreateNew={jest.fn()} />);
    expect(screen.getByText("Create Agent")).toBeInTheDocument();
  });

  it("calls onCreateNew from empty state", () => {
    const onCreateNew = jest.fn();
    render(<AgentList agents={[]} onCreateNew={onCreateNew} />);
    fireEvent.click(screen.getByText("Create Agent"));
    expect(onCreateNew).toHaveBeenCalledTimes(1);
  });
});

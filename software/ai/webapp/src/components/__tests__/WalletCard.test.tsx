import { render, screen } from "@testing-library/react";
import { WalletCard } from "../wallet/WalletCard";
import type { Wallet } from "@/types";

const mockWallet: Wallet = {
  id: "w1",
  address: "0x1234567890abcdef1234567890abcdef12345678",
  name: "My Wallet",
  chainId: 8453,
  agentCount: 3,
  totalSpent: "2.5",
  createdAt: "2024-01-01T00:00:00Z",
};

describe("WalletCard", () => {
  it("renders wallet name", () => {
    render(<WalletCard wallet={mockWallet} />);
    expect(screen.getByText("My Wallet")).toBeInTheDocument();
  });

  it("renders chain name for Base", () => {
    render(<WalletCard wallet={mockWallet} />);
    expect(screen.getByText("Base")).toBeInTheDocument();
  });

  it("renders chain name for Ethereum", () => {
    render(
      <WalletCard wallet={{ ...mockWallet, chainId: 1 }} />
    );
    expect(screen.getByText("Ethereum")).toBeInTheDocument();
  });

  it("renders chain name for Optimism", () => {
    render(
      <WalletCard wallet={{ ...mockWallet, chainId: 10 }} />
    );
    expect(screen.getByText("Optimism")).toBeInTheDocument();
  });

  it("renders chain name for Arbitrum", () => {
    render(
      <WalletCard wallet={{ ...mockWallet, chainId: 42161 }} />
    );
    expect(screen.getByText("Arbitrum")).toBeInTheDocument();
  });

  it("renders fallback chain name for unknown chain", () => {
    render(
      <WalletCard wallet={{ ...mockWallet, chainId: 999 }} />
    );
    expect(screen.getByText("Chain 999")).toBeInTheDocument();
  });

  it("renders truncated address", () => {
    render(<WalletCard wallet={mockWallet} />);
    expect(screen.getByText("0x1234...5678")).toBeInTheDocument();
  });

  it("renders agent count", () => {
    render(<WalletCard wallet={mockWallet} />);
    expect(screen.getByText("3 agents")).toBeInTheDocument();
  });

  it("renders total spent", () => {
    render(<WalletCard wallet={mockWallet} />);
    expect(screen.getByText("2.5 ETH")).toBeInTheDocument();
  });

  it("renders zero agents", () => {
    render(
      <WalletCard wallet={{ ...mockWallet, agentCount: 0 }} />
    );
    expect(screen.getByText("0 agents")).toBeInTheDocument();
  });
});

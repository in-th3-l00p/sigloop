import { render, screen, fireEvent } from "@testing-library/react";
import { WalletList } from "../wallet/WalletList";
import type { Wallet } from "@/types";

const mockWallets: Wallet[] = [
  {
    id: "w1",
    address: "0x1234567890abcdef1234567890abcdef12345678",
    name: "Wallet One",
    chainId: 8453,
    agentCount: 2,
    totalSpent: "1.0",
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "w2",
    address: "0xabcdef1234567890abcdef1234567890abcdef12",
    name: "Wallet Two",
    chainId: 1,
    agentCount: 0,
    totalSpent: "0",
    createdAt: "2024-01-02T00:00:00Z",
  },
];

describe("WalletList", () => {
  it("renders wallet cards when wallets exist", () => {
    render(<WalletList wallets={mockWallets} onCreateNew={jest.fn()} />);
    expect(screen.getByText("Wallet One")).toBeInTheDocument();
    expect(screen.getByText("Wallet Two")).toBeInTheDocument();
  });

  it("renders empty state when no wallets", () => {
    render(<WalletList wallets={[]} onCreateNew={jest.fn()} />);
    expect(screen.getByText("No wallets yet")).toBeInTheDocument();
  });

  it("renders empty state description", () => {
    render(<WalletList wallets={[]} onCreateNew={jest.fn()} />);
    expect(
      screen.getByText(
        "Create your first smart wallet to start delegating to AI agents."
      )
    ).toBeInTheDocument();
  });

  it("renders Create Wallet button in empty state", () => {
    render(<WalletList wallets={[]} onCreateNew={jest.fn()} />);
    expect(screen.getByText("Create Wallet")).toBeInTheDocument();
  });

  it("calls onCreateNew when empty state button is clicked", () => {
    const onCreateNew = jest.fn();
    render(<WalletList wallets={[]} onCreateNew={onCreateNew} />);
    fireEvent.click(screen.getByText("Create Wallet"));
    expect(onCreateNew).toHaveBeenCalledTimes(1);
  });

  it("renders all wallet cards in list", () => {
    const threeWallets: Wallet[] = [
      ...mockWallets,
      {
        id: "w3",
        address: "0x9999999999999999999999999999999999999999",
        name: "Wallet Three",
        chainId: 10,
        agentCount: 5,
        totalSpent: "10.0",
        createdAt: "2024-01-03T00:00:00Z",
      },
    ];
    render(<WalletList wallets={threeWallets} onCreateNew={jest.fn()} />);
    expect(screen.getByText("Wallet One")).toBeInTheDocument();
    expect(screen.getByText("Wallet Two")).toBeInTheDocument();
    expect(screen.getByText("Wallet Three")).toBeInTheDocument();
  });
});

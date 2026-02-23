import { render, screen, fireEvent } from "@testing-library/react";
import { createElement } from "react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Wallets } from "../Wallets";

const mockWallets = [
  {
    id: "w1",
    address: "0x1234567890abcdef1234567890abcdef12345678",
    name: "My Wallet",
    chainId: 8453,
    agentCount: 2,
    totalSpent: "1.0",
    createdAt: "2024-01-01T00:00:00Z",
  },
];

jest.mock("@/hooks/useWallet", () => ({
  useWallets: () => ({
    data: mockWallets,
    isLoading: false,
  }),
  useCreateWallet: () => ({
    mutate: jest.fn(),
    isPending: false,
  }),
}));

function renderWallets() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    createElement(
      QueryClientProvider,
      { client: queryClient },
      createElement(MemoryRouter, null, createElement(Wallets))
    )
  );
}

describe("Wallets", () => {
  it("renders Wallets header", () => {
    renderWallets();
    expect(screen.getByText("Wallets")).toBeInTheDocument();
  });

  it("renders description text", () => {
    renderWallets();
    expect(
      screen.getByText("Manage smart wallets for your AI agents")
    ).toBeInTheDocument();
  });

  it("renders Create Wallet button", () => {
    renderWallets();
    expect(screen.getByText("Create Wallet")).toBeInTheDocument();
  });

  it("renders wallet list", () => {
    renderWallets();
    expect(screen.getByText("My Wallet")).toBeInTheDocument();
  });

  it("renders wallet chain", () => {
    renderWallets();
    expect(screen.getAllByText("Base").length).toBeGreaterThanOrEqual(1);
  });
});


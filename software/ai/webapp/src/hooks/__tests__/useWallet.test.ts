import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { useWallets, useCreateWallet } from "../useWallet";
import * as walletApi from "../../api/wallets";

jest.mock("../../api/wallets");

const mockedApi = walletApi as jest.Mocked<typeof walletApi>;

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
}

describe("useWallets", () => {
  it("returns wallets from API", async () => {
    const wallets = [
      {
        id: "1",
        address: "0x1234567890abcdef1234567890abcdef12345678",
        name: "Test Wallet",
        chainId: 8453,
        agentCount: 2,
        totalSpent: "1.5",
        createdAt: "2024-01-01T00:00:00Z",
      },
    ];
    mockedApi.fetchWallets.mockResolvedValue(wallets);

    const { result } = renderHook(() => useWallets(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(wallets);
  });

  it("handles loading state", () => {
    mockedApi.fetchWallets.mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useWallets(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
  });

  it("handles error state", async () => {
    mockedApi.fetchWallets.mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useWallets(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe("useCreateWallet", () => {
  it("calls createWallet API", async () => {
    const newWallet = {
      id: "2",
      address: "0xabcdef1234567890abcdef1234567890abcdef12",
      name: "New Wallet",
      chainId: 1,
      agentCount: 0,
      totalSpent: "0",
      createdAt: "2024-01-02T00:00:00Z",
    };
    mockedApi.createWallet.mockResolvedValue(newWallet);

    const { result } = renderHook(() => useCreateWallet(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ name: "New Wallet", chainId: 1 });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedApi.createWallet).toHaveBeenCalledWith({
      name: "New Wallet",
      chainId: 1,
    });
  });
});

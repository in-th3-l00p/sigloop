import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { useSwap, useLend } from "../useDefi";
import * as clientModule from "../../api/client";

jest.mock("../../api/client");

const mockedClient = clientModule as jest.Mocked<typeof clientModule>;

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
}

describe("useSwap", () => {
  it("calls swap endpoint", async () => {
    mockedClient.apiClient.mockResolvedValue({ txHash: "0xabc123" });

    const { result } = renderHook(() => useSwap(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      walletId: "w1",
      fromToken: "ETH",
      toToken: "USDC",
      amount: "1.0",
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedClient.apiClient).toHaveBeenCalledWith("/defi/swap", {
      method: "POST",
      body: JSON.stringify({
        walletId: "w1",
        fromToken: "ETH",
        toToken: "USDC",
        amount: "1.0",
      }),
    });
  });
});

describe("useLend", () => {
  it("calls lend endpoint", async () => {
    mockedClient.apiClient.mockResolvedValue({ txHash: "0xdef456" });

    const { result } = renderHook(() => useLend(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      walletId: "w1",
      token: "USDC",
      amount: "1000",
      protocol: "aave",
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});

import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { usePayments, usePaymentStats } from "../useX402";
import * as paymentApi from "../../api/payments";

jest.mock("../../api/payments");

const mockedApi = paymentApi as jest.Mocked<typeof paymentApi>;

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
}

describe("usePayments", () => {
  it("returns payment history", async () => {
    const payments = [
      {
        id: "pay1",
        agentId: "a1",
        agentName: "Bot A",
        domain: "api.example.com",
        amount: "0.001",
        status: "settled" as const,
        timestamp: "2024-01-01T12:00:00Z",
      },
    ];
    mockedApi.fetchPayments.mockResolvedValue(payments);

    const { result } = renderHook(() => usePayments(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(payments);
  });
});

describe("usePaymentStats", () => {
  it("returns payment stats", async () => {
    const stats = {
      totalSpent: "1.5",
      totalPayments: 42,
      avgPerPayment: "0.036",
      topDomains: [{ domain: "api.example.com", amount: "0.8" }],
    };
    mockedApi.fetchPaymentStats.mockResolvedValue(stats);

    const { result } = renderHook(() => usePaymentStats(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(stats);
  });
});

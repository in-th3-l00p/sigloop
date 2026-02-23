import { fetchPayments, fetchPaymentStats } from "../payments";
import { apiClient } from "../client";

jest.mock("../client");

const mockedApiClient = apiClient as jest.MockedFunction<typeof apiClient>;

describe("fetchPayments", () => {
  it("calls apiClient with /payments", async () => {
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
    mockedApiClient.mockResolvedValue(payments);

    const result = await fetchPayments();

    expect(mockedApiClient).toHaveBeenCalledWith("/payments");
    expect(result).toEqual(payments);
  });
});

describe("fetchPaymentStats", () => {
  it("calls apiClient with /payments/stats", async () => {
    const stats = {
      totalSpent: "1.5",
      totalPayments: 42,
      avgPerPayment: "0.036",
      topDomains: [{ domain: "api.example.com", amount: "0.8" }],
    };
    mockedApiClient.mockResolvedValue(stats);

    const result = await fetchPaymentStats();

    expect(mockedApiClient).toHaveBeenCalledWith("/payments/stats");
    expect(result).toEqual(stats);
  });
});

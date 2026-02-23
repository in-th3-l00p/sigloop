import { render, screen } from "@testing-library/react";
import { createElement } from "react";
import { MemoryRouter } from "react-router-dom";
import { Payments } from "../Payments";

jest.mock("@/hooks/useX402", () => ({
  usePayments: () => ({
    data: [
      {
        id: "pay1",
        agentId: "a1",
        agentName: "Bot A",
        domain: "api.example.com",
        amount: "0.001",
        status: "settled" as const,
        timestamp: "2024-06-15T10:30:00Z",
      },
      {
        id: "pay2",
        agentId: "a2",
        agentName: "Bot B",
        domain: "data.service.io",
        amount: "0.005",
        status: "pending" as const,
        timestamp: "2024-06-15T11:00:00Z",
      },
    ],
    isLoading: false,
  }),
  usePaymentStats: () => ({
    data: {
      totalSpent: "2.5",
      totalPayments: 100,
      avgPerPayment: "0.025",
      topDomains: [{ domain: "api.example.com", amount: "1.2" }],
    },
    isLoading: false,
  }),
}));

function renderPayments() {
  return render(
    createElement(MemoryRouter, null, createElement(Payments))
  );
}

describe("Payments", () => {
  it("renders Payments header", () => {
    renderPayments();
    expect(screen.getByText("Payments")).toBeInTheDocument();
  });

  it("renders Payment History section", () => {
    renderPayments();
    expect(screen.getByText("Payment History")).toBeInTheDocument();
  });

  it("renders payment stats", () => {
    renderPayments();
    expect(screen.getByText("Total Spent")).toBeInTheDocument();
    expect(screen.getByText("2.5 ETH")).toBeInTheDocument();
  });

  it("renders total payments count", () => {
    renderPayments();
    expect(screen.getByText("100")).toBeInTheDocument();
  });

  it("renders avg per payment", () => {
    renderPayments();
    expect(screen.getByText("0.025 ETH")).toBeInTheDocument();
  });

  it("renders payment table with data", () => {
    renderPayments();
    expect(screen.getByText("Bot A")).toBeInTheDocument();
    expect(screen.getByText("Bot B")).toBeInTheDocument();
  });

  it("renders payment domains", () => {
    renderPayments();
    expect(screen.getAllByText("api.example.com").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("data.service.io")).toBeInTheDocument();
  });

  it("renders payment statuses", () => {
    renderPayments();
    expect(screen.getByText("settled")).toBeInTheDocument();
    expect(screen.getByText("pending")).toBeInTheDocument();
  });
});

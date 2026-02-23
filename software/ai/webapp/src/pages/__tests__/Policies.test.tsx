import { render, screen, fireEvent } from "@testing-library/react";
import { createElement } from "react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Policies } from "../Policies";

jest.mock("@/hooks/usePolicy", () => ({
  usePolicies: () => ({
    data: [
      {
        id: "p1",
        name: "Default Policy",
        spending: { maxPerTx: "0.1", dailyLimit: "1.0", weeklyLimit: "5.0" },
        allowlist: { contracts: ["0xabc"], functions: ["transfer"] },
        timeWindow: { validAfter: "", validUntil: "" },
        createdAt: "2024-01-01T00:00:00Z",
      },
    ],
    isLoading: false,
  }),
  useCreatePolicy: () => ({
    mutate: jest.fn(),
    isPending: false,
  }),
}));

function renderPolicies() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    createElement(
      QueryClientProvider,
      { client: queryClient },
      createElement(MemoryRouter, null, createElement(Policies))
    )
  );
}

describe("Policies", () => {
  it("renders Policies header", () => {
    renderPolicies();
    expect(screen.getByText("Policies")).toBeInTheDocument();
  });

  it("renders description text", () => {
    renderPolicies();
    expect(
      screen.getByText(
        "Define spending limits, allowlists, and time windows for agent permissions"
      )
    ).toBeInTheDocument();
  });

  it("renders Create Policy button", () => {
    renderPolicies();
    expect(screen.getByText("Create Policy")).toBeInTheDocument();
  });

  it("renders policy card", () => {
    renderPolicies();
    expect(screen.getByText("Default Policy")).toBeInTheDocument();
  });

  it("renders policy spending limits", () => {
    renderPolicies();
    expect(screen.getByText("0.1 ETH")).toBeInTheDocument();
    expect(screen.getByText("1.0 ETH")).toBeInTheDocument();
    expect(screen.getByText("5.0 ETH")).toBeInTheDocument();
  });

  it("renders contract count", () => {
    renderPolicies();
    expect(screen.getByText("1 contracts")).toBeInTheDocument();
  });
});


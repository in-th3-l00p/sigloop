import { render, screen, fireEvent } from "@testing-library/react";
import { createElement } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CreateAgentDialog } from "../agent/CreateAgentDialog";

jest.mock("@/hooks/useAgent", () => ({
  useCreateAgent: () => ({
    mutate: jest.fn(),
    isPending: false,
  }),
}));

jest.mock("@/hooks/useWallet", () => ({
  useWallets: () => ({
    data: [
      { id: "w1", name: "Wallet One" },
      { id: "w2", name: "Wallet Two" },
    ],
  }),
}));

jest.mock("@/hooks/usePolicy", () => ({
  usePolicies: () => ({
    data: [
      { id: "p1", name: "Policy One" },
      { id: "p2", name: "Policy Two" },
    ],
  }),
}));

function renderDialog(open = true) {
  const onOpenChange = jest.fn();
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  const result = render(
    createElement(
      QueryClientProvider,
      { client: queryClient },
      createElement(CreateAgentDialog, { open, onOpenChange })
    )
  );

  return { ...result, onOpenChange };
}

describe("CreateAgentDialog", () => {
  it("renders dialog title when open", () => {
    renderDialog(true);
    expect(screen.getByText("Create Agent")).toBeInTheDocument();
  });

  it("does not render dialog when closed", () => {
    renderDialog(false);
    expect(screen.queryByText("Create Agent")).not.toBeInTheDocument();
  });

  it("renders Name input", () => {
    renderDialog(true);
    expect(screen.getByPlaceholderText("Payment Agent")).toBeInTheDocument();
  });

  it("renders Name label", () => {
    renderDialog(true);
    expect(screen.getByText("Name")).toBeInTheDocument();
  });

  it("renders Wallet label", () => {
    renderDialog(true);
    expect(screen.getByText("Wallet")).toBeInTheDocument();
  });

  it("renders Policy label", () => {
    renderDialog(true);
    expect(screen.getByText("Policy")).toBeInTheDocument();
  });

  it("renders Expires At label", () => {
    renderDialog(true);
    expect(screen.getByText("Expires At")).toBeInTheDocument();
  });

  it("renders Cancel button", () => {
    renderDialog(true);
    expect(screen.getByText("Cancel")).toBeInTheDocument();
  });

  it("renders Create button", () => {
    renderDialog(true);
    const buttons = screen.getAllByText("Create");
    expect(buttons.length).toBeGreaterThanOrEqual(1);
  });

  it("calls onOpenChange when Cancel is clicked", () => {
    const { onOpenChange } = renderDialog(true);
    fireEvent.click(screen.getByText("Cancel"));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});

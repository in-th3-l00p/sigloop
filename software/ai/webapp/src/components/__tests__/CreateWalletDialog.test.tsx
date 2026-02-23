import { render, screen, fireEvent } from "@testing-library/react";
import { createElement } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CreateWalletDialog } from "../wallet/CreateWalletDialog";

jest.mock("@/hooks/useWallet", () => ({
  useCreateWallet: () => ({
    mutate: jest.fn(),
    isPending: false,
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
      createElement(CreateWalletDialog, { open, onOpenChange })
    )
  );

  return { ...result, onOpenChange };
}

describe("CreateWalletDialog", () => {
  it("renders dialog title when open", () => {
    renderDialog(true);
    expect(screen.getByText("Create Wallet")).toBeInTheDocument();
  });

  it("does not render dialog content when closed", () => {
    renderDialog(false);
    expect(screen.queryByText("Create Wallet")).not.toBeInTheDocument();
  });

  it("renders name input", () => {
    renderDialog(true);
    expect(screen.getByPlaceholderText("My Agent Wallet")).toBeInTheDocument();
  });

  it("renders Name label", () => {
    renderDialog(true);
    expect(screen.getByText("Name")).toBeInTheDocument();
  });

  it("renders Chain label", () => {
    renderDialog(true);
    expect(screen.getByText("Chain")).toBeInTheDocument();
  });

  it("renders Cancel button", () => {
    renderDialog(true);
    expect(screen.getByText("Cancel")).toBeInTheDocument();
  });

  it("renders Create button", () => {
    renderDialog(true);
    expect(screen.getByText("Create")).toBeInTheDocument();
  });

  it("Create button is disabled when name is empty", () => {
    renderDialog(true);
    const createBtn = screen.getByText("Create");
    expect(createBtn).toBeDisabled();
  });

  it("calls onOpenChange when Cancel is clicked", () => {
    const { onOpenChange } = renderDialog(true);
    fireEvent.click(screen.getByText("Cancel"));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("enables Create button when name is entered", () => {
    renderDialog(true);
    const input = screen.getByPlaceholderText("My Agent Wallet");
    fireEvent.change(input, { target: { value: "Test Wallet" } });
    const createBtn = screen.getByText("Create");
    expect(createBtn).not.toBeDisabled();
  });
});

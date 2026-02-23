import { render, screen, fireEvent } from "@testing-library/react";
import { createElement } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PolicyBuilder } from "../policy/PolicyBuilder";

jest.mock("@/hooks/usePolicy", () => ({
  useCreatePolicy: () => ({
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
      createElement(PolicyBuilder, { open, onOpenChange })
    )
  );

  return { ...result, onOpenChange };
}

describe("PolicyBuilder", () => {
  it("renders dialog title when open", () => {
    renderDialog(true);
    expect(screen.getAllByText("Create Policy").length).toBeGreaterThanOrEqual(1);
  });

  it("does not render dialog when closed", () => {
    renderDialog(false);
    expect(screen.queryByText("Create Policy")).not.toBeInTheDocument();
  });

  it("renders Policy Name input", () => {
    renderDialog(true);
    expect(
      screen.getByPlaceholderText("Default Spending Policy")
    ).toBeInTheDocument();
  });

  it("renders Policy Name label", () => {
    renderDialog(true);
    expect(screen.getByText("Policy Name")).toBeInTheDocument();
  });

  it("renders Spending Limits section", () => {
    renderDialog(true);
    expect(screen.getByText("Spending Limits")).toBeInTheDocument();
  });

  it("renders Allowed Contracts section", () => {
    renderDialog(true);
    expect(screen.getByText("Allowed Contracts")).toBeInTheDocument();
  });

  it("renders Time Window section", () => {
    renderDialog(true);
    expect(screen.getByText("Time Window")).toBeInTheDocument();
  });

  it("renders Valid After label", () => {
    renderDialog(true);
    expect(screen.getByText("Valid After")).toBeInTheDocument();
  });

  it("renders Valid Until label", () => {
    renderDialog(true);
    expect(screen.getByText("Valid Until")).toBeInTheDocument();
  });

  it("renders Cancel button", () => {
    renderDialog(true);
    expect(screen.getByText("Cancel")).toBeInTheDocument();
  });

  it("renders Create Policy button", () => {
    renderDialog(true);
    const buttons = screen.getAllByText("Create Policy");
    expect(buttons.length).toBeGreaterThanOrEqual(1);
  });

  it("Create Policy button is disabled when name is empty", () => {
    renderDialog(true);
    const buttons = screen.getAllByText("Create Policy");
    const submitButton = buttons.find(
      (btn) => btn.closest("[data-slot='button']") !== null
    );
    expect(submitButton?.closest("button")).toBeDisabled();
  });

  it("calls onOpenChange when Cancel is clicked", () => {
    const { onOpenChange } = renderDialog(true);
    fireEvent.click(screen.getByText("Cancel"));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});

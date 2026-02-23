import { render, screen, fireEvent } from "@testing-library/react";
import { EmptyState } from "../shared/EmptyState";
import { Wallet } from "lucide-react";

describe("EmptyState", () => {
  it("renders title", () => {
    render(
      <EmptyState
        icon={Wallet}
        title="No wallets yet"
        description="Create your first wallet"
      />
    );
    expect(screen.getByText("No wallets yet")).toBeInTheDocument();
  });

  it("renders description", () => {
    render(
      <EmptyState
        icon={Wallet}
        title="No wallets yet"
        description="Create your first wallet"
      />
    );
    expect(screen.getByText("Create your first wallet")).toBeInTheDocument();
  });

  it("renders action button when actionLabel and onAction provided", () => {
    const onAction = jest.fn();
    render(
      <EmptyState
        icon={Wallet}
        title="No wallets yet"
        description="Create your first wallet"
        actionLabel="Create Wallet"
        onAction={onAction}
      />
    );
    expect(screen.getByText("Create Wallet")).toBeInTheDocument();
  });

  it("calls onAction when button clicked", () => {
    const onAction = jest.fn();
    render(
      <EmptyState
        icon={Wallet}
        title="No wallets yet"
        description="Create your first wallet"
        actionLabel="Create Wallet"
        onAction={onAction}
      />
    );
    fireEvent.click(screen.getByText("Create Wallet"));
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it("does not render button when actionLabel is missing", () => {
    render(
      <EmptyState
        icon={Wallet}
        title="No wallets yet"
        description="Create your first wallet"
      />
    );
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("does not render button when onAction is missing", () => {
    render(
      <EmptyState
        icon={Wallet}
        title="No wallets yet"
        description="Create your first wallet"
        actionLabel="Create Wallet"
      />
    );
    expect(screen.queryByText("Create Wallet")).not.toBeInTheDocument();
  });
});

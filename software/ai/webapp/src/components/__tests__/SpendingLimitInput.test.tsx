import { render, screen, fireEvent } from "@testing-library/react";
import { SpendingLimitInput } from "../policy/SpendingLimitInput";
import type { SpendingLimit } from "@/types";

describe("SpendingLimitInput", () => {
  const defaultValue: SpendingLimit = {
    maxPerTx: "",
    dailyLimit: "",
    weeklyLimit: "",
  };

  it("renders Spending Limits heading", () => {
    render(<SpendingLimitInput value={defaultValue} onChange={jest.fn()} />);
    expect(screen.getByText("Spending Limits")).toBeInTheDocument();
  });

  it("renders Max Per Tx label", () => {
    render(<SpendingLimitInput value={defaultValue} onChange={jest.fn()} />);
    expect(screen.getByText("Max Per Tx (ETH)")).toBeInTheDocument();
  });

  it("renders Daily Limit label", () => {
    render(<SpendingLimitInput value={defaultValue} onChange={jest.fn()} />);
    expect(screen.getByText("Daily Limit (ETH)")).toBeInTheDocument();
  });

  it("renders Weekly Limit label", () => {
    render(<SpendingLimitInput value={defaultValue} onChange={jest.fn()} />);
    expect(screen.getByText("Weekly Limit (ETH)")).toBeInTheDocument();
  });

  it("renders input placeholders", () => {
    render(<SpendingLimitInput value={defaultValue} onChange={jest.fn()} />);
    expect(screen.getByPlaceholderText("0.1")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("1.0")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("5.0")).toBeInTheDocument();
  });

  it("displays current values", () => {
    const value: SpendingLimit = {
      maxPerTx: "0.5",
      dailyLimit: "2.0",
      weeklyLimit: "10.0",
    };
    render(<SpendingLimitInput value={value} onChange={jest.fn()} />);
    expect(screen.getByDisplayValue("0.5")).toBeInTheDocument();
    expect(screen.getByDisplayValue("2.0")).toBeInTheDocument();
    expect(screen.getByDisplayValue("10.0")).toBeInTheDocument();
  });

  it("calls onChange with updated maxPerTx", () => {
    const onChange = jest.fn();
    render(<SpendingLimitInput value={defaultValue} onChange={onChange} />);
    fireEvent.change(screen.getByPlaceholderText("0.1"), {
      target: { value: "0.5" },
    });
    expect(onChange).toHaveBeenCalledWith({
      ...defaultValue,
      maxPerTx: "0.5",
    });
  });

  it("calls onChange with updated dailyLimit", () => {
    const onChange = jest.fn();
    render(<SpendingLimitInput value={defaultValue} onChange={onChange} />);
    fireEvent.change(screen.getByPlaceholderText("1.0"), {
      target: { value: "3.0" },
    });
    expect(onChange).toHaveBeenCalledWith({
      ...defaultValue,
      dailyLimit: "3.0",
    });
  });

  it("calls onChange with updated weeklyLimit", () => {
    const onChange = jest.fn();
    render(<SpendingLimitInput value={defaultValue} onChange={onChange} />);
    fireEvent.change(screen.getByPlaceholderText("5.0"), {
      target: { value: "15.0" },
    });
    expect(onChange).toHaveBeenCalledWith({
      ...defaultValue,
      weeklyLimit: "15.0",
    });
  });
});

import { render, screen, fireEvent } from "@testing-library/react";
import { AllowlistEditor } from "../policy/AllowlistEditor";
import type { Allowlist } from "@/types";

describe("AllowlistEditor", () => {
  const defaultValue: Allowlist = {
    contracts: [],
    functions: [],
  };

  it("renders Allowed Contracts heading", () => {
    render(<AllowlistEditor value={defaultValue} onChange={jest.fn()} />);
    expect(screen.getByText("Allowed Contracts")).toBeInTheDocument();
  });

  it("renders Allowed Functions heading", () => {
    render(<AllowlistEditor value={defaultValue} onChange={jest.fn()} />);
    expect(screen.getByText("Allowed Functions")).toBeInTheDocument();
  });

  it("renders Add buttons", () => {
    render(<AllowlistEditor value={defaultValue} onChange={jest.fn()} />);
    const addButtons = screen.getAllByText("Add");
    expect(addButtons).toHaveLength(2);
  });

  it("calls onChange when adding a contract", () => {
    const onChange = jest.fn();
    render(<AllowlistEditor value={defaultValue} onChange={onChange} />);
    const addButtons = screen.getAllByText("Add");
    fireEvent.click(addButtons[0]);
    expect(onChange).toHaveBeenCalledWith({
      contracts: [""],
      functions: [],
    });
  });

  it("calls onChange when adding a function", () => {
    const onChange = jest.fn();
    render(<AllowlistEditor value={defaultValue} onChange={onChange} />);
    const addButtons = screen.getAllByText("Add");
    fireEvent.click(addButtons[1]);
    expect(onChange).toHaveBeenCalledWith({
      contracts: [],
      functions: [""],
    });
  });

  it("renders contract inputs when contracts exist", () => {
    const value: Allowlist = {
      contracts: ["0xabc"],
      functions: [],
    };
    render(<AllowlistEditor value={value} onChange={jest.fn()} />);
    expect(screen.getByDisplayValue("0xabc")).toBeInTheDocument();
  });

  it("renders function inputs when functions exist", () => {
    const value: Allowlist = {
      contracts: [],
      functions: ["transfer(address,uint256)"],
    };
    render(<AllowlistEditor value={value} onChange={jest.fn()} />);
    expect(
      screen.getByDisplayValue("transfer(address,uint256)")
    ).toBeInTheDocument();
  });

  it("calls onChange when updating a contract", () => {
    const onChange = jest.fn();
    const value: Allowlist = {
      contracts: ["0xabc"],
      functions: [],
    };
    render(<AllowlistEditor value={value} onChange={onChange} />);
    fireEvent.change(screen.getByDisplayValue("0xabc"), {
      target: { value: "0xdef" },
    });
    expect(onChange).toHaveBeenCalledWith({
      contracts: ["0xdef"],
      functions: [],
    });
  });

  it("calls onChange when updating a function", () => {
    const onChange = jest.fn();
    const value: Allowlist = {
      contracts: [],
      functions: ["transfer"],
    };
    render(<AllowlistEditor value={value} onChange={onChange} />);
    fireEvent.change(screen.getByDisplayValue("transfer"), {
      target: { value: "approve" },
    });
    expect(onChange).toHaveBeenCalledWith({
      contracts: [],
      functions: ["approve"],
    });
  });

  it("renders remove buttons for contracts", () => {
    const value: Allowlist = {
      contracts: ["0xabc", "0xdef"],
      functions: [],
    };
    const { container } = render(
      <AllowlistEditor value={value} onChange={jest.fn()} />
    );
    const removeButtons = container.querySelectorAll(
      "[data-slot='button'][data-size='icon']"
    );
    expect(removeButtons.length).toBeGreaterThanOrEqual(2);
  });

  it("renders placeholders for contract inputs", () => {
    const value: Allowlist = {
      contracts: [""],
      functions: [],
    };
    render(<AllowlistEditor value={value} onChange={jest.fn()} />);
    expect(screen.getByPlaceholderText("0x...")).toBeInTheDocument();
  });

  it("renders placeholders for function inputs", () => {
    const value: Allowlist = {
      contracts: [],
      functions: [""],
    };
    render(<AllowlistEditor value={value} onChange={jest.fn()} />);
    expect(
      screen.getByPlaceholderText("transfer(address,uint256)")
    ).toBeInTheDocument();
  });
});

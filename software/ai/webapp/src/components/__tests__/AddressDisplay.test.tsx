import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AddressDisplay } from "../shared/AddressDisplay";

const mockClipboard = {
  writeText: jest.fn().mockResolvedValue(undefined),
};

Object.defineProperty(navigator, "clipboard", {
  value: mockClipboard,
  writable: true,
});

describe("AddressDisplay", () => {
  const fullAddress = "0x1234567890abcdef1234567890abcdef12345678";

  beforeEach(() => {
    mockClipboard.writeText.mockClear();
  });

  it("renders truncated address", () => {
    render(<AddressDisplay address={fullAddress} />);
    expect(screen.getByText("0x1234...5678")).toBeInTheDocument();
  });

  it("truncates to first 6 and last 4 characters", () => {
    const address = "0xABCDEF0000000000000000000000000000009999";
    render(<AddressDisplay address={address} />);
    expect(screen.getByText("0xABCD...9999")).toBeInTheDocument();
  });

  it("renders as a button", () => {
    render(<AddressDisplay address={fullAddress} />);
    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
  });

  it("copies address to clipboard on click", async () => {
    render(<AddressDisplay address={fullAddress} />);
    const button = screen.getByRole("button");

    fireEvent.click(button);

    expect(mockClipboard.writeText).toHaveBeenCalledWith(fullAddress);
  });

  it("applies custom className", () => {
    render(<AddressDisplay address={fullAddress} className="custom-class" />);
    const button = screen.getByRole("button");
    expect(button.className).toContain("custom-class");
  });

  it("has mono font class", () => {
    render(<AddressDisplay address={fullAddress} />);
    const button = screen.getByRole("button");
    expect(button.className).toContain("font-mono");
  });
});

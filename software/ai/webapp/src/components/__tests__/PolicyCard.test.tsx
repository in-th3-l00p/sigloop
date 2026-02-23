import { render, screen } from "@testing-library/react";
import { PolicyCard } from "../policy/PolicyCard";
import type { Policy } from "@/types";

const mockPolicy: Policy = {
  id: "p1",
  name: "Default Policy",
  spending: { maxPerTx: "0.1", dailyLimit: "1.0", weeklyLimit: "5.0" },
  allowlist: {
    contracts: ["0xaaa", "0xbbb"],
    functions: ["transfer"],
  },
  timeWindow: {
    validAfter: "2024-01-01T00:00:00Z",
    validUntil: "2025-12-31T00:00:00Z",
  },
  createdAt: "2024-01-01T00:00:00Z",
};

describe("PolicyCard", () => {
  it("renders policy name", () => {
    render(<PolicyCard policy={mockPolicy} />);
    expect(screen.getByText("Default Policy")).toBeInTheDocument();
  });

  it("renders contract count", () => {
    render(<PolicyCard policy={mockPolicy} />);
    expect(screen.getByText("2 contracts")).toBeInTheDocument();
  });

  it("renders per tx spending limit", () => {
    render(<PolicyCard policy={mockPolicy} />);
    expect(screen.getByText("0.1 ETH")).toBeInTheDocument();
  });

  it("renders daily spending limit", () => {
    render(<PolicyCard policy={mockPolicy} />);
    expect(screen.getByText("1.0 ETH")).toBeInTheDocument();
  });

  it("renders weekly spending limit", () => {
    render(<PolicyCard policy={mockPolicy} />);
    expect(screen.getByText("5.0 ETH")).toBeInTheDocument();
  });

  it("renders Per Tx label", () => {
    render(<PolicyCard policy={mockPolicy} />);
    expect(screen.getByText("Per Tx")).toBeInTheDocument();
  });

  it("renders Daily label", () => {
    render(<PolicyCard policy={mockPolicy} />);
    expect(screen.getByText("Daily")).toBeInTheDocument();
  });

  it("renders Weekly label", () => {
    render(<PolicyCard policy={mockPolicy} />);
    expect(screen.getByText("Weekly")).toBeInTheDocument();
  });

  it("renders time window when set", () => {
    render(<PolicyCard policy={mockPolicy} />);
    const afterDate = new Date("2024-01-01T00:00:00Z").toLocaleDateString();
    const untilDate = new Date("2025-12-31T00:00:00Z").toLocaleDateString();
    expect(
      screen.getByText(`${afterDate} - ${untilDate}`)
    ).toBeInTheDocument();
  });

  it("does not render time window when not set", () => {
    const policyNoTime = {
      ...mockPolicy,
      timeWindow: { validAfter: "", validUntil: "" },
    };
    render(<PolicyCard policy={policyNoTime} />);
    expect(screen.queryByText(/Now/)).not.toBeInTheDocument();
  });

  it("renders Now when validAfter is empty but validUntil is set", () => {
    const policy = {
      ...mockPolicy,
      timeWindow: { validAfter: "", validUntil: "2025-12-31T00:00:00Z" },
    };
    render(<PolicyCard policy={policy} />);
    const untilDate = new Date("2025-12-31T00:00:00Z").toLocaleDateString();
    expect(screen.getByText(`Now - ${untilDate}`)).toBeInTheDocument();
  });

  it("renders No expiry when validUntil is empty but validAfter is set", () => {
    const policy = {
      ...mockPolicy,
      timeWindow: { validAfter: "2024-01-01T00:00:00Z", validUntil: "" },
    };
    render(<PolicyCard policy={policy} />);
    const afterDate = new Date("2024-01-01T00:00:00Z").toLocaleDateString();
    expect(
      screen.getByText(`${afterDate} - No expiry`)
    ).toBeInTheDocument();
  });

  it("renders zero contracts", () => {
    const policy = {
      ...mockPolicy,
      allowlist: { contracts: [], functions: [] },
    };
    render(<PolicyCard policy={policy} />);
    expect(screen.getByText("0 contracts")).toBeInTheDocument();
  });
});

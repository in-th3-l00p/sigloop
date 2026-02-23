import { render, screen } from "@testing-library/react";
import { BudgetIndicator } from "../payment/BudgetIndicator";

describe("BudgetIndicator", () => {
  it("renders label", () => {
    render(<BudgetIndicator used={0.5} total={1.0} label="Daily Budget" />);
    expect(screen.getByText("Daily Budget")).toBeInTheDocument();
  });

  it("renders used/total values", () => {
    render(<BudgetIndicator used={0.5} total={1.0} label="Daily Budget" />);
    expect(screen.getByText("0.5000 / 1.0000 ETH")).toBeInTheDocument();
  });

  it("renders green bar when under 75%", () => {
    const { container } = render(
      <BudgetIndicator used={0.5} total={1.0} label="Budget" />
    );
    const bar = container.querySelector(".bg-emerald-500");
    expect(bar).toBeInTheDocument();
  });

  it("renders amber bar when between 75% and 90%", () => {
    const { container } = render(
      <BudgetIndicator used={0.8} total={1.0} label="Budget" />
    );
    const bar = container.querySelector(".bg-amber-500");
    expect(bar).toBeInTheDocument();
  });

  it("renders red bar when over 90%", () => {
    const { container } = render(
      <BudgetIndicator used={0.95} total={1.0} label="Budget" />
    );
    const bar = container.querySelector(".bg-red-500");
    expect(bar).toBeInTheDocument();
  });

  it("handles zero total", () => {
    const { container } = render(
      <BudgetIndicator used={0} total={0} label="Budget" />
    );
    expect(screen.getByText("0.0000 / 0.0000 ETH")).toBeInTheDocument();
    const bar = container.querySelector(".bg-emerald-500");
    expect(bar).toBeInTheDocument();
  });

  it("caps percentage at 100%", () => {
    const { container } = render(
      <BudgetIndicator used={1.5} total={1.0} label="Budget" />
    );
    const bar = container.querySelector(".bg-red-500");
    expect(bar).toBeInTheDocument();
    expect(bar?.getAttribute("style")).toContain("width: 100%");
  });

  it("renders correct percentage width", () => {
    const { container } = render(
      <BudgetIndicator used={0.5} total={1.0} label="Budget" />
    );
    const bar = container.querySelector(".bg-emerald-500");
    expect(bar?.getAttribute("style")).toContain("width: 50%");
  });

  it("renders exact 75% as warning", () => {
    const { container } = render(
      <BudgetIndicator used={0.76} total={1.0} label="Budget" />
    );
    const bar = container.querySelector(".bg-amber-500");
    expect(bar).toBeInTheDocument();
  });

  it("renders exact 90% as danger", () => {
    const { container } = render(
      <BudgetIndicator used={0.91} total={1.0} label="Budget" />
    );
    const bar = container.querySelector(".bg-red-500");
    expect(bar).toBeInTheDocument();
  });
});

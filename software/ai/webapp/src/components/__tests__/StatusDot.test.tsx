import { render, screen } from "@testing-library/react";
import { StatusDot } from "../shared/StatusDot";

describe("StatusDot", () => {
  it("renders a span element", () => {
    const { container } = render(<StatusDot color="green" />);
    const dot = container.querySelector("span");
    expect(dot).toBeInTheDocument();
  });

  it("applies green color class", () => {
    const { container } = render(<StatusDot color="green" />);
    const dot = container.querySelector("span");
    expect(dot?.className).toContain("bg-emerald-500");
  });

  it("applies red color class", () => {
    const { container } = render(<StatusDot color="red" />);
    const dot = container.querySelector("span");
    expect(dot?.className).toContain("bg-red-500");
  });

  it("applies yellow color class", () => {
    const { container } = render(<StatusDot color="yellow" />);
    const dot = container.querySelector("span");
    expect(dot?.className).toContain("bg-amber-500");
  });

  it("applies gray color class", () => {
    const { container } = render(<StatusDot color="gray" />);
    const dot = container.querySelector("span");
    expect(dot?.className).toContain("bg-zinc-500");
  });

  it("applies rounded-full class", () => {
    const { container } = render(<StatusDot color="green" />);
    const dot = container.querySelector("span");
    expect(dot?.className).toContain("rounded-full");
  });

  it("applies custom className", () => {
    const { container } = render(
      <StatusDot color="green" className="ml-2" />
    );
    const dot = container.querySelector("span");
    expect(dot?.className).toContain("ml-2");
  });
});

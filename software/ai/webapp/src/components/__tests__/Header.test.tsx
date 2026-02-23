import { render, screen } from "@testing-library/react";
import { Header } from "../layout/Header";

describe("Header", () => {
  it("renders the title", () => {
    render(<Header title="Dashboard" />);
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
  });

  it("renders different titles", () => {
    render(<Header title="Wallets" />);
    expect(screen.getByText("Wallets")).toBeInTheDocument();
  });

  it("renders the title as h1", () => {
    render(<Header title="Dashboard" />);
    const heading = screen.getByText("Dashboard");
    expect(heading.tagName).toBe("H1");
  });

  it("renders Connected badge", () => {
    render(<Header title="Dashboard" />);
    expect(screen.getByText("Connected")).toBeInTheDocument();
  });

  it("renders as a header element", () => {
    const { container } = render(<Header title="Dashboard" />);
    expect(container.querySelector("header")).toBeInTheDocument();
  });
});

import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Sidebar } from "../layout/Sidebar";

function renderSidebar() {
  return render(
    <MemoryRouter>
      <Sidebar />
    </MemoryRouter>
  );
}

describe("Sidebar", () => {
  it("renders the sigloop brand name", () => {
    renderSidebar();
    expect(screen.getByText("sigloop")).toBeInTheDocument();
  });

  it("renders the S logo", () => {
    renderSidebar();
    expect(screen.getByText("S")).toBeInTheDocument();
  });

  it("renders all nav items", () => {
    renderSidebar();
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Wallets")).toBeInTheDocument();
    expect(screen.getByText("Agents")).toBeInTheDocument();
    expect(screen.getByText("Policies")).toBeInTheDocument();
    expect(screen.getByText("Payments")).toBeInTheDocument();
    expect(screen.getByText("Settings")).toBeInTheDocument();
  });

  it("renders nav links with correct hrefs", () => {
    renderSidebar();
    expect(screen.getByText("Dashboard").closest("a")).toHaveAttribute(
      "href",
      "/"
    );
    expect(screen.getByText("Wallets").closest("a")).toHaveAttribute(
      "href",
      "/wallets"
    );
    expect(screen.getByText("Agents").closest("a")).toHaveAttribute(
      "href",
      "/agents"
    );
    expect(screen.getByText("Policies").closest("a")).toHaveAttribute(
      "href",
      "/policies"
    );
    expect(screen.getByText("Payments").closest("a")).toHaveAttribute(
      "href",
      "/payments"
    );
    expect(screen.getByText("Settings").closest("a")).toHaveAttribute(
      "href",
      "/settings"
    );
  });

  it("renders version info", () => {
    renderSidebar();
    expect(screen.getByText("Sigloop v0.1.0")).toBeInTheDocument();
  });

  it("renders as an aside element", () => {
    const { container } = renderSidebar();
    expect(container.querySelector("aside")).toBeInTheDocument();
  });
});

import { render, screen } from "@testing-library/react";
import { AgentStatusBadge } from "../agent/AgentStatusBadge";

describe("AgentStatusBadge", () => {
  it("renders Active label for active status", () => {
    render(<AgentStatusBadge status="active" />);
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("renders Revoked label for revoked status", () => {
    render(<AgentStatusBadge status="revoked" />);
    expect(screen.getByText("Revoked")).toBeInTheDocument();
  });

  it("renders Expired label for expired status", () => {
    render(<AgentStatusBadge status="expired" />);
    expect(screen.getByText("Expired")).toBeInTheDocument();
  });

  it("applies emerald class for active status", () => {
    const { container } = render(<AgentStatusBadge status="active" />);
    const badge = container.querySelector("[data-slot='badge']");
    expect(badge?.className).toContain("text-emerald-500");
  });

  it("applies red class for revoked status", () => {
    const { container } = render(<AgentStatusBadge status="revoked" />);
    const badge = container.querySelector("[data-slot='badge']");
    expect(badge?.className).toContain("text-red-500");
  });

  it("applies amber class for expired status", () => {
    const { container } = render(<AgentStatusBadge status="expired" />);
    const badge = container.querySelector("[data-slot='badge']");
    expect(badge?.className).toContain("text-amber-500");
  });
});

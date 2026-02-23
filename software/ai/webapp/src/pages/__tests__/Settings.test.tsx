import { render, screen, fireEvent } from "@testing-library/react";
import { createElement } from "react";
import { MemoryRouter } from "react-router-dom";
import { Settings } from "../Settings";

function renderSettings() {
  return render(
    createElement(MemoryRouter, null, createElement(Settings))
  );
}

describe("Settings", () => {
  it("renders Settings header", () => {
    renderSettings();
    expect(screen.getByText("Settings")).toBeInTheDocument();
  });

  it("renders API Configuration card", () => {
    renderSettings();
    expect(screen.getByText("API Configuration")).toBeInTheDocument();
  });

  it("renders API URL label", () => {
    renderSettings();
    expect(screen.getByText("API URL")).toBeInTheDocument();
  });

  it("renders default API URL value", () => {
    renderSettings();
    expect(
      screen.getByDisplayValue("http://localhost:3001")
    ).toBeInTheDocument();
  });

  it("renders Save button", () => {
    renderSettings();
    expect(screen.getByText("Save")).toBeInTheDocument();
  });

  it("renders API description text", () => {
    renderSettings();
    expect(
      screen.getByText("The base URL for the Sigloop backend API")
    ).toBeInTheDocument();
  });

  it("renders Chain Selection card", () => {
    renderSettings();
    expect(screen.getByText("Chain Selection")).toBeInTheDocument();
  });

  it("renders Default Chain label", () => {
    renderSettings();
    expect(screen.getByText("Default Chain")).toBeInTheDocument();
  });

  it("renders Appearance card", () => {
    renderSettings();
    expect(screen.getByText("Appearance")).toBeInTheDocument();
  });

  it("renders Dark Mode option", () => {
    renderSettings();
    expect(screen.getByText("Dark Mode")).toBeInTheDocument();
  });

  it("renders Enabled button (disabled)", () => {
    renderSettings();
    expect(screen.getByText("Enabled")).toBeInTheDocument();
    expect(screen.getByText("Enabled")).toBeDisabled();
  });

  it("renders dark mode description", () => {
    renderSettings();
    expect(
      screen.getByText("Dark theme is enabled by default")
    ).toBeInTheDocument();
  });

  it("allows editing API URL", () => {
    renderSettings();
    const input = screen.getByDisplayValue("http://localhost:3001");
    fireEvent.change(input, { target: { value: "http://example.com:3001" } });
    expect(
      screen.getByDisplayValue("http://example.com:3001")
    ).toBeInTheDocument();
  });
});

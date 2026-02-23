import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { PageContainer } from "../layout/PageContainer";

describe("PageContainer", () => {
  it("renders the sidebar", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route element={<PageContainer />}>
            <Route path="/" element={<div>Test Page</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText("sigloop")).toBeInTheDocument();
  });

  it("renders child route content via Outlet", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route element={<PageContainer />}>
            <Route path="/" element={<div>Child Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText("Child Content")).toBeInTheDocument();
  });

  it("renders main content area", () => {
    const { container } = render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route element={<PageContainer />}>
            <Route path="/" element={<div>Page</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );
    expect(container.querySelector("main")).toBeInTheDocument();
  });
});

import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { NavLink } from "../NavLink";

function renderNavLink(to: string, currentRoute: string, activeClassName?: string) {
  return render(
    <MemoryRouter initialEntries={[currentRoute]}>
      <Routes>
        <Route
          path="*"
          element={
            <NavLink to={to} className="base" activeClassName={activeClassName}>
              Link Text
            </NavLink>
          }
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe("NavLink", () => {
  it("renders the link text", () => {
    renderNavLink("/about", "/");
    expect(screen.getByText("Link Text")).toBeInTheDocument();
  });

  it("renders as a link element", () => {
    renderNavLink("/about", "/");
    expect(screen.getByRole("link")).toBeInTheDocument();
  });

  it("applies base className", () => {
    renderNavLink("/about", "/");
    expect(screen.getByRole("link")).toHaveClass("base");
  });

  it("applies activeClassName when route matches", () => {
    renderNavLink("/about", "/about", "active-class");
    expect(screen.getByRole("link")).toHaveClass("active-class");
  });

  it("does not apply activeClassName when route does not match", () => {
    renderNavLink("/about", "/other", "active-class");
    expect(screen.getByRole("link")).not.toHaveClass("active-class");
  });
});

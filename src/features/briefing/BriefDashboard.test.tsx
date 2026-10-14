import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { BriefDashboard } from "./BriefDashboard";

describe("BriefDashboard", () => {
  it("renders a risk summary and the top contingencies", () => {
    render(
      <MemoryRouter>
        <BriefDashboard />
      </MemoryRouter>,
    );

    expect(screen.getByText(/day risk/i)).toBeInTheDocument();
    expect(screen.getByText(/contingencies/i)).toBeInTheDocument();
    expect(screen.getAllByRole("link").length).toBeGreaterThan(0);
  });
});

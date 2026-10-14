import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { AlertsPage } from "./AlertsPage";

describe("AlertsPage", () => {
  it("renders the triggered alert feed", () => {
    render(
      <MemoryRouter>
        <AlertsPage />
      </MemoryRouter>,
    );

    expect(screen.getByText(/triggered alerts/i)).toBeInTheDocument();
    expect(screen.getAllByRole("link").length).toBeGreaterThan(0);
  });
});

import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { DebriefPage } from "./DebriefPage";

describe("DebriefPage", () => {
  it("renders the debrief metrics and carry-forward list", () => {
    render(
      <MemoryRouter>
        <DebriefPage />
      </MemoryRouter>,
    );

    expect(screen.getByText(/nightly debrief/i)).toBeInTheDocument();
    expect(screen.getByText(/carry-forward/i)).toBeInTheDocument();
    expect(screen.getByText(/accuracy/i)).toBeInTheDocument();
  });
});

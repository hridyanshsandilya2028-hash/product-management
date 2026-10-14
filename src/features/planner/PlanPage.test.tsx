import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PlanPage } from "./PlanPage";

describe("PlanPage", () => {
  it("renders the timeline and tomorrow prep checklist", () => {
    render(<PlanPage />);

    expect(screen.getByText(/day plan/i)).toBeInTheDocument();
    expect(screen.getByText(/tomorrow's prep checklist/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/daily timeline/i)).toBeInTheDocument();
  });
});

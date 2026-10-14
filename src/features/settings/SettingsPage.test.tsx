import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SettingsPage } from "./SettingsPage";

describe("SettingsPage", () => {
  it("renders the settings sections", () => {
    render(<SettingsPage />);

    expect(screen.getByText(/settings/i)).toBeInTheDocument();
    expect(screen.getByText(/risk tolerance/i)).toBeInTheDocument();
    expect(screen.getByText(/custom situations/i)).toBeInTheDocument();
  });
});

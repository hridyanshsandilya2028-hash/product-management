import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { WarRoomPage } from "./WarRoomPage";

describe("WarRoomPage", () => {
  it("renders personalized charts and segment analysis", () => {
    render(<WarRoomPage />);

    expect(screen.getByRole("heading", { name: "War Room" })).toBeInTheDocument();
    expect(screen.getByText("PATTERNS")).toBeInTheDocument();
    expect(screen.getByText("SEGMENT COVERAGE")).toBeInTheDocument();
  });
});

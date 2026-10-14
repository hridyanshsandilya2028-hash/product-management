import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { WarRoomPage } from "./WarRoomPage";

describe("WarRoomPage", () => {
  it("renders the weekly charts and pattern analysis", () => {
    render(<WarRoomPage />);

    expect(screen.getByText(/war room/i)).toBeInTheDocument();
    expect(screen.getByText(/patterns/i)).toBeInTheDocument();
    expect(screen.getByText(/risk spikes tuesdays 8-9am/i)).toBeInTheDocument();
  });
});

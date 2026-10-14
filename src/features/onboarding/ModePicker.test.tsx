import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import { ModePicker } from "./ModePicker";

describe("ModePicker", () => {
  afterEach(() => {
    cleanup();
    window.localStorage.clear();
    document.documentElement.dataset.theme = "vigilante";
  });

  it("redirects returning users to the brief", () => {
    window.localStorage.setItem("contingency-genius-mode", "shadow");
    render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={<ModePicker />} />
          <Route path="/brief" element={<div>Brief ready</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Brief ready")).toBeInTheDocument();
  });

  it("lets the user choose a mode and enter the brief", () => {
    render(
      <MemoryRouter>
        <ModePicker />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("radio", { name: /shadow/i }));
    expect(screen.getByText("ACTIVE")).toBeInTheDocument();
    expect(document.documentElement.dataset.theme).toBe("shadow");
  });
});

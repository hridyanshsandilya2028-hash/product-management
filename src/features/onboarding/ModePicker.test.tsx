import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import { ModePicker } from "./ModePicker";
import { useAppStore } from "../../store/useAppStore";

describe("ModePicker", () => {
  afterEach(() => {
    cleanup();
    window.localStorage.clear();
    document.documentElement.dataset.theme = "vigilante";
  });

  it("starts a fresh onboarding flow each time", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={<ModePicker />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText(/stay ready/i)).toBeInTheDocument();
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

  it("builds a personalized day from the user's commitments and concerns", async () => {
    render(
      <MemoryRouter>
        <Routes>
          <Route path="*" element={<ModePicker />} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText(/what does your day look like/i), {
      target: { value: "Classes, commute, and a late appointment" },
    });
    fireEvent.change(screen.getByLabelText(/what could get in the way/i), {
      target: { value: "rain, low battery" },
    });
    fireEvent.change(screen.getByLabelText(/event name/i), {
      target: { value: "Evening appointment" },
    });
    fireEvent.click(screen.getByRole("button", { name: /add to my day/i }));
    expect(screen.getByText("Evening appointment")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /build my contingency plan/i }));
    expect(useAppStore.getState().profile.dayDescription).toBe("Classes, commute, and a late appointment");
    expect(useAppStore.getState().profile.dayEvents).toHaveLength(1);
    expect(useAppStore.getState().briefing.situations.some((item) => item.title.includes("rain"))).toBe(true);
  });
});

import { describe, expect, it } from "vitest";
import { defaultProfile } from "../data/mockProfiles";
import { mockWeatherSnapshot } from "../data/mockWeather";
import { calculateRiskScore, generateSituations } from "./riskEngine";
import type { CalendarEvent, WeatherSnapshot } from "../types";

describe("risk engine", () => {
  it("flags an outdoor event during heavy rain", () => {
    const weather: WeatherSnapshot = { ...mockWeatherSnapshot, rainProbability: 90 };
    const events: CalendarEvent[] = [
      { id: "outdoor-1", title: "Client walk-through", start: "2026-10-13T09:00:00", end: "2026-10-13T10:30:00", outdoor: true },
    ];

    const situations = generateSituations(weather, events, defaultProfile, "normal", []);
    expect(situations.some((situation) => situation.category === "weather")).toBe(true);
  });

  it("detects commute traffic spikes", () => {
    const weather: WeatherSnapshot = { ...mockWeatherSnapshot, rainProbability: 30 };
    const events: CalendarEvent[] = [
      { id: "commute-1", title: "Morning commute", start: "2026-10-13T08:15:00", end: "2026-10-13T08:45:00", outdoor: true },
    ];

    const situations = generateSituations(weather, events, defaultProfile, "normal", []);
    expect(situations.some((situation) => situation.category === "traffic")).toBe(true);
  });

  it("flags back-to-back events with under 10 minutes of slack", () => {
    const weather: WeatherSnapshot = { ...mockWeatherSnapshot, rainProbability: 15 };
    const events: CalendarEvent[] = [
      { id: "evt-a", title: "Standup", start: "2026-10-13T08:00:00", end: "2026-10-13T08:25:00", outdoor: false },
      { id: "evt-b", title: "Escalation review", start: "2026-10-13T08:30:00", end: "2026-10-13T09:00:00", outdoor: false },
    ];

    const situations = generateSituations(weather, events, defaultProfile, "normal", []);
    expect(situations.some((situation) => situation.category === "schedule")).toBe(true);
  });

  it("flags long battery-draining days with no free gap", () => {
    const weather: WeatherSnapshot = { ...mockWeatherSnapshot, rainProbability: 10 };
    const events: CalendarEvent[] = [
      { id: "evt-1", title: "Desk time", start: "2026-10-13T08:00:00", end: "2026-10-13T12:00:00", outdoor: false },
      { id: "evt-2", title: "Review", start: "2026-10-13T12:00:00", end: "2026-10-13T15:00:00", outdoor: false },
      { id: "evt-3", title: "Night check-in", start: "2026-10-13T15:00:00", end: "2026-10-13T18:00:00", outdoor: false },
    ];

    const situations = generateSituations(weather, events, defaultProfile, "normal", []);
    expect(situations.some((situation) => situation.category === "battery")).toBe(true);
  });

  it("creates a contingency plan for a commitment up to 24 hours", () => {
    const weather: WeatherSnapshot = { ...mockWeatherSnapshot, rainProbability: 10 };
    const events: CalendarEvent[] = [
      { id: "full-day", title: "Full-day responsibility", start: "2026-10-13T08:00:00", end: "2026-10-14T08:00:00", outdoor: false },
    ];

    const situations = generateSituations(weather, events, defaultProfile, "normal", []);
    const plan = situations.find((situation) => situation.id === "long-full-day");
    expect(plan?.planA.length).toBeGreaterThan(0);
    expect(plan?.planB.length).toBeGreaterThan(0);
    expect(plan?.impact).toBe("high");
  });

  it("flags after-dark outdoor travel beside sunset", () => {
    const weather: WeatherSnapshot = { ...mockWeatherSnapshot, rainProbability: 20, sunset: "2026-10-13T17:30:00" };
    const events: CalendarEvent[] = [
      { id: "night-ride", title: "Night commute", start: "2026-10-13T20:00:00", end: "2026-10-13T20:45:00", outdoor: true },
    ];

    const situations = generateSituations(weather, events, defaultProfile, "normal", []);
    expect(situations.some((situation) => situation.category === "safety")).toBe(true);
  });

  it("curates a precise preparation risk for an interview segment", () => {
    const events: CalendarEvent[] = [
      { id: "interview", title: "Product interview", start: "2026-10-13T10:00:00", end: "2026-10-13T11:00:00", location: "Office" },
    ];

    const situations = generateSituations({ ...mockWeatherSnapshot, rainProbability: 0 }, events, defaultProfile, "normal", []);
    const plan = situations.find((situation) => situation.id === "segment-prep-interview");
    expect(plan?.title).toContain("last-minute preparation");
    expect(plan?.planA).toEqual([
      "Finish the essential preparation before this block",
      "Keep the required files, notes, or materials together",
    ]);
  });

  it("curates a travel buffer risk for a commute segment", () => {
    const events: CalendarEvent[] = [
      { id: "commute", title: "Morning commute", start: "2026-10-13T06:30:00", end: "2026-10-13T07:30:00", location: "Station" },
    ];

    const situations = generateSituations({ ...mockWeatherSnapshot, rainProbability: 0 }, events, defaultProfile, "normal", []);
    expect(situations.some((situation) => situation.id === "segment-travel-commute")).toBe(true);
  });

  it("includes custom situations and computes a bounded risk score", () => {
    const custom = [
      {
        id: "custom-3",
        title: "Custom issue",
        category: "custom" as const,
        likelihood: 90,
        impact: "high" as const,
        planA: ["Plan A"],
        planB: ["Plan B"],
        status: "open" as const,
      },
    ];

    const score = calculateRiskScore(generateSituations(mockWeatherSnapshot, [], defaultProfile, "low", custom));
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });
});

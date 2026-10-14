import type { CalendarEvent } from "../types";

export const mockCalendarEvents: CalendarEvent[] = [
  {
    id: "evt-1",
    title: "Team standup",
    start: "2026-10-13T08:00:00",
    end: "2026-10-13T08:30:00",
    location: "HQ",
    outdoor: false,
  },
  {
    id: "evt-2",
    title: "Client walk-through",
    start: "2026-10-13T09:00:00",
    end: "2026-10-13T10:30:00",
    location: "North Yard",
    outdoor: true,
  },
  {
    id: "evt-3",
    title: "Lunch sync",
    start: "2026-10-13T12:00:00",
    end: "2026-10-13T12:45:00",
    location: "Cafeteria",
    outdoor: false,
  },
  {
    id: "evt-4",
    title: "Evening commute",
    start: "2026-10-13T17:30:00",
    end: "2026-10-13T18:15:00",
    location: "Downtown",
    outdoor: true,
  },
  {
    id: "evt-5",
    title: "Dinner meet-up",
    start: "2026-10-13T18:30:00",
    end: "2026-10-13T19:30:00",
    location: "Riverside",
    outdoor: true,
  },
];

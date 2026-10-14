import type { CalendarEvent } from "../types";
import { mockCalendarEvents } from "../data/mockEvents";

export interface CalendarService {
  getCalendarEvents: (day: string) => Promise<CalendarEvent[]>;
}

export class MockCalendarService implements CalendarService {
  async getCalendarEvents(day: string): Promise<CalendarEvent[]> {
    if (!day) {
      return mockCalendarEvents;
    }

    return mockCalendarEvents.filter((event) => event.start.startsWith(day));
  }
}

export const calendarService: CalendarService = new MockCalendarService();

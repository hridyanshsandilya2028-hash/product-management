import type { CalendarEvent } from "../types";

export interface CalendarService {
  getCalendarEvents: (day: string) => Promise<CalendarEvent[]>;
}

export class MockCalendarService implements CalendarService {
  async getCalendarEvents(day: string): Promise<CalendarEvent[]> {
    void day;
    return [];
  }
}

export const calendarService: CalendarService = new MockCalendarService();

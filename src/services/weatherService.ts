import { addDays, formatISO } from "date-fns";
import type { WeatherSnapshot } from "../types";
import { mockWeatherSnapshot } from "../data/mockWeather";

export interface WeatherService {
  fetchDayWeather: (latitude: number, longitude: number, date: string) => Promise<WeatherSnapshot>;
}

export class MockWeatherService implements WeatherService {
  async fetchDayWeather(_latitude: number, _longitude: number, date: string): Promise<WeatherSnapshot> {
    const fallbackDate = date || formatISO(addDays(new Date(), 1), { representation: "date" });
    return {
      ...mockWeatherSnapshot,
      date: fallbackDate,
      sunset: `${fallbackDate}T18:13:00`,
    };
  }
}

export const weatherService: WeatherService = new MockWeatherService();

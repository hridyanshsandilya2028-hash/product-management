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

export class OpenMeteoWeatherService implements WeatherService {
  async fetchDayWeather(latitude: number, longitude: number, date: string): Promise<WeatherSnapshot> {
    const targetDate = date || formatISO(new Date(), { representation: "date" });
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,precipitation_probability_max,wind_speed_10m_max,sunrise,sunset&timezone=auto&start_date=${targetDate}&end_date=${targetDate}`,
    );
    if (!response.ok) {
      throw new Error(`Weather request failed with status ${response.status}`);
    }
    const data = await response.json() as {
      daily?: {
        temperature_2m_max?: number[];
        precipitation_probability_max?: number[];
        wind_speed_10m_max?: number[];
        sunset?: string[];
      };
    };
    const daily = data.daily;
    if (!daily?.temperature_2m_max?.[0] || !daily.precipitation_probability_max?.[0] || !daily.sunset?.[0]) {
      throw new Error("Weather response did not include a complete daily forecast");
    }
    const rainProbability = daily.precipitation_probability_max[0];
    return {
      date: targetDate,
      temperature: Math.round(daily.temperature_2m_max[0]),
      precipitationProbability: rainProbability,
      rainProbability,
      windSpeed: Math.round(daily.wind_speed_10m_max?.[0] ?? 0),
      sunset: daily.sunset[0],
      conditions: rainProbability >= 60 ? "rain possible" : rainProbability >= 30 ? "mixed conditions" : "mostly clear",
    };
  }
}

export const weatherService: WeatherService = new OpenMeteoWeatherService();

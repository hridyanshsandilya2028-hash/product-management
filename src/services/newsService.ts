import type { NewsSignal } from "../types";
export type { NewsSignal } from "../types";

export interface NewsService {
  getRelevantSignals: (query: string, location?: string) => Promise<NewsSignal[]>;
}

const newsFunctionUrl = import.meta.env.VITE_NEWS_FUNCTION_URL as string | undefined;

export class CiteWireNewsService implements NewsService {
  async getRelevantSignals(query: string, location?: string): Promise<NewsSignal[]> {
    if (!newsFunctionUrl) {
      return [];
    }

    const response = await fetch(newsFunctionUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, location }),
    });
    if (!response.ok) {
      throw new Error(`CiteWire news request failed with status ${response.status}`);
    }
    const payload = await response.json() as { signals?: NewsSignal[] };
    return payload.signals ?? [];
  }
}

export const newsService: NewsService = new CiteWireNewsService();

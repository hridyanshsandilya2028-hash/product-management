import type { NewsSignal } from "../types";
export type { NewsSignal } from "../types";

export interface NewsService {
  getRelevantSignals: (query: string, location?: string) => Promise<{ signals: NewsSignal[]; locationLabel?: string }>;
}

const newsFunctionUrl = (import.meta.env.VITE_NEWS_FUNCTION_URL as string | undefined) ?? "/api/news";

export class CiteWireNewsService implements NewsService {
  async getRelevantSignals(query: string, location?: string): Promise<{ signals: NewsSignal[]; locationLabel?: string }> {
    if (!newsFunctionUrl) {
      return { signals: [] };
    }

    const response = await fetch(newsFunctionUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, location }),
    });
    if (!response.ok) {
      throw new Error(`CiteWire news request failed with status ${response.status}`);
    }
    const payload = await response.json() as { signals?: unknown; locationLabel?: unknown };
    const signals = Array.isArray(payload.signals)
      ? payload.signals.filter((signal): signal is NewsSignal => {
          if (!signal || typeof signal !== "object") return false;
          const candidate = signal as Partial<NewsSignal>;
          return typeof candidate.title === "string"
            && typeof candidate.summary === "string"
            && typeof candidate.source === "string"
            && typeof candidate.publishedAt === "string"
            && (candidate.severity === "low" || candidate.severity === "medium" || candidate.severity === "high");
        })
      : [];
    return {
      signals,
      locationLabel: typeof payload.locationLabel === "string" ? payload.locationLabel : undefined,
    };
  }
}

export const newsService: NewsService = new CiteWireNewsService();

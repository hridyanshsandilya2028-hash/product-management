import { afterEach, describe, expect, it, vi } from "vitest";
import { CiteWireNewsService } from "./newsService";

describe("CiteWireNewsService", () => {
  afterEach(() => vi.restoreAllMocks());

  it("uses the local news endpoint when no custom function URL is configured", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({
        signals: [{
          title: "Transit alert",
          summary: "Delays",
          source: "Test",
          publishedAt: "2026-10-17",
          severity: "medium",
        }],
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const signals = await new CiteWireNewsService().getRelevantSignals("morning commute");

    expect(fetchMock).toHaveBeenCalledWith("/api/news", expect.objectContaining({ method: "POST" }));
    expect(signals[0].title).toBe("Transit alert");
  });
});

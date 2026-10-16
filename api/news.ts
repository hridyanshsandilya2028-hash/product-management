type Request = {
  method?: string;
  body?: unknown;
};

type Response = {
  status: (code: number) => Response;
  json: (body: unknown) => void;
};

type NewsItem = {
  title: string;
  summary: string;
  source: string;
  publishedAt: string;
  severity: "low" | "medium" | "high";
  category: "weather" | "traffic" | "safety" | "regional" | "general";
};

type LocationAddress = {
  city?: string;
  town?: string;
  village?: string;
  county?: string;
  state?: string;
  country?: string;
};

function decodeXml(value: string): string {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

function readTag(item: string, tag: string): string {
  const match = item.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, "i"));
  return match ? decodeXml(match[1]) : "";
}

function classify(title: string, summary: string): Pick<NewsItem, "category" | "severity"> {
  const text = `${title} ${summary}`.toLowerCase();
  if (/(emergency|evacuat|shooting|earthquake|terror|major outage|airport closure)/.test(text)) {
    return { category: "safety", severity: "high" };
  }
  if (/(storm|flood|heatwave|hurricane|snow|wildfire|severe weather)/.test(text)) {
    return { category: "weather", severity: "high" };
  }
  if (/(traffic|transit|rail|flight|airport|road closure|strike|delay)/.test(text)) {
    return { category: "traffic", severity: "medium" };
  }
  if (/(warning|alert|closure|disruption|protest)/.test(text)) {
    return { category: "regional", severity: "medium" };
  }
  return { category: "general", severity: "low" };
}

async function resolveLocation(value: string): Promise<string> {
  const [latitude, longitude] = value.split(",").map(Number);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return value;
  }

  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=10`,
    { headers: { Accept: "application/json", "User-Agent": "ContingencyGenius/1.0" } },
  );
  if (!response.ok) {
    return value;
  }

  const payload = await response.json() as { address?: LocationAddress };
  const address = payload.address ?? {};
  return [
    address.city ?? address.town ?? address.village ?? address.county,
    address.state,
    address.country,
  ].filter(Boolean).join(", ") || value;
}

export default async function handler(request: Request, response: Response) {
  if (request.method !== "POST") {
    response.status(405).json({ error: "Use POST for news queries." });
    return;
  }

  const body = (request.body ?? {}) as { query?: string; location?: string };

  try {
    const location = body.location ? await resolveLocation(body.location) : "";
    const query = [
      location && `"${location}"`,
      body.query,
      "traffic transit weather closure alert disruption",
    ].filter(Boolean).join(" ").trim() || "local traffic transit weather disruptions";
    const feedUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;
    const feedResponse = await fetch(feedUrl, {
      headers: { Accept: "application/rss+xml, application/xml, text/xml" },
    });
    if (!feedResponse.ok) {
      response.status(502).json({ error: `News provider returned ${feedResponse.status}.` });
      return;
    }

    const xml = await feedResponse.text();
    const signals: NewsItem[] = (xml.match(/<item>[\s\S]*?<\/item>/gi) ?? [])
      .slice(0, 8)
      .map((item) => {
        const title = readTag(item, "title");
        const summary = readTag(item, "description");
        return {
          title,
          summary: summary || "Recent headline relevant to your day.",
          source: readTag(item, "source") || "Google News",
          publishedAt: readTag(item, "pubDate") || new Date().toISOString(),
          ...classify(title, summary),
        };
      })
      .filter((signal) => signal.title.length > 0);

    response.status(200).json({ signals });
  } catch {
    response.status(502).json({ error: "News provider is temporarily unavailable." });
  }
}

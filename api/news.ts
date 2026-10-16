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

async function fetchFeed(query: string): Promise<string> {
  const feedUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;
  const response = await fetch(feedUrl, {
    headers: { Accept: "application/rss+xml, application/xml, text/xml" },
  });
  if (!response.ok) {
    throw new Error(`News provider returned ${response.status}.`);
  }
  return response.text();
}

function parseSignals(xml: string): NewsItem[] {
  return (xml.match(/<item>[\s\S]*?<\/item>/gi) ?? [])
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
}

function rankLocalSignals(signals: NewsItem[], location: string): NewsItem[] {
  const terms = location.toLowerCase().split(/[,\s]+/).filter((term) => term.length >= 3);
  return [...signals].sort((left, right) => {
    const score = (signal: NewsItem) => {
      const text = `${signal.title} ${signal.summary}`.toLowerCase();
      return terms.reduce((total, term) => total + (text.includes(term) ? 2 : 0), 0)
        + (signal.category === "traffic" || signal.category === "weather" || signal.category === "safety" ? 1 : 0);
    };
    return score(right) - score(left);
  });
}

export default async function handler(request: Request, response: Response) {
  if (request.method !== "POST") {
    response.status(405).json({ error: "Use POST for news queries." });
    return;
  }

  const body = (request.body ?? {}) as { query?: string; location?: string };

  try {
    const location = body.location ? await resolveLocation(body.location) : "";
    const localQuery = location
      ? `"${location}" (traffic OR transit OR weather OR closure OR alert OR disruption)`
      : "local traffic transit weather closure alert disruption";
    let signals = parseSignals(await fetchFeed(localQuery));

    if (signals.length === 0 && location) {
      signals = parseSignals(await fetchFeed(`"${location}"`));
    }

    if (signals.length === 0 && body.query) {
      signals = parseSignals(await fetchFeed(body.query));
    }

    response.status(200).json({
      signals: rankLocalSignals(signals, location).map((signal) => ({ ...signal, location: location || undefined })),
      locationLabel: location || undefined,
    });
  } catch {
    response.status(502).json({ error: "News provider is temporarily unavailable." });
  }
}

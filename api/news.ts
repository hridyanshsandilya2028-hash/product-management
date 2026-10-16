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

export default async function handler(request: Request, response: Response) {
  if (request.method !== "POST") {
    response.status(405).json({ error: "Use POST for news queries." });
    return;
  }

  const body = (request.body ?? {}) as { query?: string; location?: string };
  const query = [body.query, body.location].filter(Boolean).join(" ").trim() || "world news travel weather disruptions";
  const feedUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;

  try {
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

import { getCached, setCache } from "./cache.js";

const POSITIVE_WORDS = [
  "upgrade", "upgraded", "beat", "beats", "surge", "growth", "green", "sustainable",
  "sustainability", "approval", "approved", "partnership", "inclusion", "record",
  "positive", "outperform", "renewable", "carbon neutral", "esg leader", "dividend",
  "expansion", "innovation", "milestone", "commitment", "net zero",
];

const NEGATIVE_WORDS = [
  "fine", "fined", "investigation", "lawsuit", "allegation", "scandal", "downgrade",
  "downgraded", "violation", "breach", "delay", "delayed", "miss", "misses", "loss",
  "decline", "layoff", "layoffs", "fraud", "corruption", "deforestation", "pollution",
  "warning", "probe", "resign", "resignation", "strike", "recall",
];

function decodeXml(text) {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/<[^>]+>/g, "");
}

function scoreHeadline(text) {
  const lower = text.toLowerCase();
  let pos = 0;
  let neg = 0;
  POSITIVE_WORDS.forEach((w) => {
    if (lower.includes(w)) pos += 1;
  });
  NEGATIVE_WORDS.forEach((w) => {
    if (lower.includes(w)) neg += 1;
  });
  if (pos === 0 && neg === 0) return 0;
  return Math.max(-1, Math.min(1, (pos - neg) / Math.max(pos + neg, 1)));
}

function buildSearchQuery(stock) {
  const base = stock.company.replace(/\(.*\)/, "").trim();
  return encodeURIComponent(`${base} ESG stock ${stock.country}`);
}

function parseRssItems(xml) {
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];
    const titleMatch = block.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i);
    const linkMatch = block.match(/<link>([\s\S]*?)<\/link>/i);
    const pubMatch = block.match(/<pubDate>([\s\S]*?)<\/pubDate>/i);
    if (titleMatch) {
      const title = decodeXml(titleMatch[1].trim());
      if (title && !title.includes("Google News")) {
        items.push({
          title,
          link: linkMatch ? linkMatch[1].trim() : null,
          publishedAt: pubMatch ? pubMatch[1].trim() : null,
        });
      }
    }
  }
  return items;
}

export async function searchWebNews(stock) {
  const cacheKey = `news:${stock.ticker}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const query = buildSearchQuery(stock);
  const url = `https://news.google.com/rss/search?q=${query}&hl=en&gl=US&ceid=US:en`;

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) throw new Error(`News fetch failed: ${res.status}`);

    const xml = await res.text();
    const items = parseRssItems(xml).slice(0, 8);

    if (items.length === 0) throw new Error("No headlines found");

    const scores = items.map((item) => scoreHeadline(item.title));
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    const sentiment = Math.round(Math.max(-1, Math.min(1, avgScore)) * 100) / 100;

    const result = {
      headlines: items.slice(0, 5).map((i) => i.title),
      items: items.slice(0, 5),
      newsSentimentMultiplier: sentiment,
      sentimentLabel:
        sentiment > 0.2 ? "Bullish" : sentiment < -0.2 ? "Bearish" : "Neutral",
      sourcesScanned: items.length,
      searchQuery: decodeURIComponent(query),
      source: "google_news_rss",
      live: true,
      fetchedAt: new Date().toISOString(),
    };

    setCache(cacheKey, result, 10 * 60 * 1000);
    return result;
  } catch (err) {
    return {
      headlines: [],
      items: [],
      newsSentimentMultiplier: null,
      error: err.message,
      source: "fetch_failed",
      live: false,
    };
  }
}

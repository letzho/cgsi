import { getCached, setCache } from "./cache.js";
import { generateJSON, isAIEnabled } from "./llm.js";

const CACHE_KEY = "verita:overnight";
const CACHE_TTL_MS = 15 * 60 * 1000;
const OVERNIGHT_HOURS = 18;

const SEARCH_QUERIES = [
  "ASEAN ESG stocks overnight",
  "Singapore Malaysia equity after hours",
  "Southeast Asia green finance ESG",
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

function parseRssItems(xml) {
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];
    const titleMatch = block.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i);
    const linkMatch = block.match(/<link>([\s\S]*?)<\/link>/i);
    const pubMatch = block.match(/<pubDate>([\s\S]*?)<\/pubDate>/i);
    const sourceMatch = block.match(/<source[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/source>/i);

    if (titleMatch) {
      const title = decodeXml(titleMatch[1].trim());
      if (title && !title.includes("Google News")) {
        items.push({
          title,
          link: linkMatch ? linkMatch[1].trim() : null,
          publishedAt: pubMatch ? pubMatch[1].trim() : null,
          source: sourceMatch ? decodeXml(sourceMatch[1].trim()) : null,
        });
      }
    }
  }
  return items;
}

function isWithinOvernightWindow(pubDateStr) {
  if (!pubDateStr) return true;
  const pub = new Date(pubDateStr);
  if (Number.isNaN(pub.getTime())) return true;
  return Date.now() - pub.getTime() <= OVERNIGHT_HOURS * 60 * 60 * 1000;
}

function getOvernightWindowLabel() {
  const end = new Date();
  const start = new Date(end.getTime() - OVERNIGHT_HOURS * 60 * 60 * 1000);
  const fmt = (d) =>
    d.toLocaleString("en-SG", {
      timeZone: "Asia/Singapore",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  return `${fmt(start)} – ${fmt(end)} SGT (off-hours)`;
}

async function fetchRssQuery(query) {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en&gl=SG&ceid=SG:en`;
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
    signal: AbortSignal.timeout(12000),
  });
  if (!res.ok) throw new Error(`News fetch failed: ${res.status}`);
  const xml = await res.text();
  return parseRssItems(xml);
}

export async function fetchOvernightHeadlines() {
  const seen = new Set();
  const merged = [];

  for (const query of SEARCH_QUERIES) {
    try {
      const items = await fetchRssQuery(query);
      for (const item of items) {
        const key = item.title.toLowerCase();
        if (seen.has(key)) continue;
        if (!isWithinOvernightWindow(item.publishedAt)) continue;
        seen.add(key);
        merged.push({ ...item, searchQuery: query });
      }
    } catch {
      // continue with other queries
    }
  }

  merged.sort((a, b) => {
    const ta = new Date(a.publishedAt || 0).getTime();
    const tb = new Date(b.publishedAt || 0).getTime();
    return tb - ta;
  });

  return merged.slice(0, 12);
}

function fallbackSummary(headlines) {
  const top = headlines.slice(0, 5);
  return {
    title: "Overnight ASEAN ESG Brief",
    overview:
      top.length > 0
        ? `Tracking ${top.length} headline${top.length === 1 ? "" : "s"} from off-hours ASEAN ESG and equity flows.`
        : "No fresh overnight headlines detected — markets may be in a quiet window.",
    bullets: top.map((h) => h.title),
    marketTone: "Neutral",
    esgHighlights: top.slice(0, 2).map((h) => h.title),
    watchlist: [],
    method: "rule_based",
  };
}

async function summarizeOvernightNews(headlines) {
  if (headlines.length === 0) {
    return fallbackSummary([]);
  }

  if (!isAIEnabled()) {
    return fallbackSummary(headlines);
  }

  const headlineBlock = headlines
    .slice(0, 10)
    .map((h, i) => `${i + 1}. ${h.title}${h.source ? ` (${h.source})` : ""}`)
    .join("\n");

  try {
    const result = await generateJSON(
      `You are Verita News, the overnight desk for CGS ESG Momentum Engine — an institutional ASEAN ESG equity terminal.
Summarize off-hours and overnight news for portfolio managers. Focus on ESG, sustainability, regulatory, and market-moving ASEAN equity stories.
Be concise and actionable.`,
      `Overnight/off-hours headline feed (last ${OVERNIGHT_HOURS}h, SGT context):

${headlineBlock}

Return JSON:
{
  "title": "short headline for the brief",
  "overview": "2-3 sentence executive summary of overnight themes",
  "bullets": ["3-5 key bullet points"],
  "marketTone": "Bullish" | "Bearish" | "Neutral" | "Mixed",
  "esgHighlights": ["1-3 ESG-specific takeaways"],
  "watchlist": ["tickers or companies to watch, e.g. SEMBCORP.SI"]
}`,
      { maxTokens: 700 }
    );

    return {
      ...result,
      method: "openai",
    };
  } catch {
    return fallbackSummary(headlines);
  }
}

export async function getVeritaNewsBundle({ forceRefresh = false } = {}) {
  if (!forceRefresh) {
    const cached = getCached(CACHE_KEY);
    if (cached) return cached;
  }

  const headlines = await fetchOvernightHeadlines();
  const aiSummary = await summarizeOvernightNews(headlines);

  const bundle = {
    brand: "Verita News",
    tagline: "Overnight & off-hours ASEAN ESG wire",
    overnightWindow: getOvernightWindowLabel(),
    headlines,
    aiSummary,
    live: headlines.length > 0,
    fetchedAt: new Date().toISOString(),
    aiEnabled: isAIEnabled(),
  };

  setCache(CACHE_KEY, bundle, CACHE_TTL_MS);
  return bundle;
}

export async function subscribeVeritaNewsStream(res) {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });

  const send = (payload) => {
    if (!res.writableEnded) {
      res.write(`data: ${JSON.stringify(payload)}\n\n`);
    }
  };

  send({
    type: "connected",
    brand: "Verita News",
    message: "Streaming overnight ASEAN ESG headlines…",
    timestamp: new Date().toISOString(),
  });

  try {
    const bundle = await getVeritaNewsBundle();

    send({
      type: "window",
      overnightWindow: bundle.overnightWindow,
      fetchedAt: bundle.fetchedAt,
      timestamp: new Date().toISOString(),
    });

    for (const headline of bundle.headlines) {
      send({
        type: "headline",
        headline,
        timestamp: new Date().toISOString(),
      });
      await new Promise((r) => setTimeout(r, 400));
    }

    send({
      type: "summary",
      aiSummary: bundle.aiSummary,
      aiEnabled: bundle.aiEnabled,
      timestamp: new Date().toISOString(),
    });

    send({
      type: "complete",
      count: bundle.headlines.length,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    send({
      type: "error",
      message: err.message,
      timestamp: new Date().toISOString(),
    });
  }

  const keepAlive = setInterval(() => {
    if (!res.writableEnded) {
      res.write(": keepalive\n\n");
    }
  }, 25000);

  res.on("close", () => {
    clearInterval(keepAlive);
  });
}

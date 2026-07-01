import { getCached, setCache } from "./cache.js";
import { generateJSON, isAIEnabled } from "./llm.js";

const CACHE_KEY = "verita:overnight";
const CACHE_TTL_MS = 15 * 60 * 1000;
const OVERNIGHT_HOURS = 18;
const ASEAN_MIN_HEADLINES = 3;

const ASEAN_QUERIES = [
  "ASEAN ESG stocks overnight",
  "Singapore Malaysia equity after hours",
  "Southeast Asia green finance ESG",
];

/** US / global stories with plausible ASEAN market spillover when regional wire is quiet */
const GLOBAL_SPILLOVER_QUERIES = [
  "US Europe news Southeast Asia markets impact",
  "El Nino climate Asia supply chain commodities",
  "Europe air conditioning demand Asia manufacturers exports",
  "US Federal Reserve Asia emerging markets equities",
  "China US trade ASEAN manufacturing supply chain",
  "global energy LNG palm oil Asia exporters",
  "semiconductor demand Asia technology stocks",
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

async function fetchRssQuery(query, { region = "SG" } = {}) {
  const locale =
    region === "US"
      ? { hl: "en", gl: "US", ceid: "US:en" }
      : { hl: "en", gl: "SG", ceid: "SG:en" };
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=${locale.hl}&gl=${locale.gl}&ceid=${locale.ceid}`;
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

async function collectFromQueries(queries, { feed, region = "SG", seen, relaxTimeWindow = false }) {
  const collected = [];

  for (const query of queries) {
    try {
      const items = await fetchRssQuery(query, { region });
      for (const item of items) {
        const key = item.title.toLowerCase();
        if (seen.has(key)) continue;
        if (!relaxTimeWindow && !isWithinOvernightWindow(item.publishedAt)) continue;
        seen.add(key);
        collected.push({ ...item, searchQuery: query, feed });
      }
    } catch {
      // continue with other queries
    }
  }

  return collected;
}

export async function fetchOvernightHeadlines() {
  const seen = new Set();
  let aseanHeadlines = await collectFromQueries(ASEAN_QUERIES, {
    feed: "asean",
    region: "SG",
    seen,
  });

  let globalHeadlines = [];
  let feedMode = "asean";

  if (aseanHeadlines.length < ASEAN_MIN_HEADLINES) {
    globalHeadlines = await collectFromQueries(GLOBAL_SPILLOVER_QUERIES, {
      feed: "global_spillover",
      region: "US",
      seen,
      relaxTimeWindow: aseanHeadlines.length === 0,
    });
    feedMode =
      aseanHeadlines.length === 0
        ? "global_spillover"
        : "mixed";
  }

  const merged = [...aseanHeadlines, ...globalHeadlines];
  merged.sort((a, b) => {
    const ta = new Date(a.publishedAt || 0).getTime();
    const tb = new Date(b.publishedAt || 0).getTime();
    return tb - ta;
  });

  return {
    headlines: merged.slice(0, 12),
    feedMode,
    aseanCount: aseanHeadlines.length,
    globalCount: globalHeadlines.length,
  };
}

function fallbackSummary(headlines, feedMode = "asean") {
  const top = headlines.slice(0, 5);
  const globalNote =
    feedMode === "global_spillover"
      ? " ASEAN wire quiet — surfacing US/global headlines with potential ASEAN spillover."
      : feedMode === "mixed"
        ? " Blended with US/global spillover stories where ASEAN coverage is thin."
        : "";

  return {
    title:
      feedMode === "global_spillover"
        ? "Global Spillover Brief (ASEAN Impact)"
        : "Overnight ASEAN ESG Brief",
    overview:
      top.length > 0
        ? `Tracking ${top.length} headline${top.length === 1 ? "" : "s"} from off-hours flows.${globalNote}`
        : "No fresh overnight headlines detected — markets may be in a quiet window.",
    bullets: top.map((h) => h.title),
    marketTone: "Neutral",
    esgHighlights: top.slice(0, 2).map((h) => h.title),
    aseanImplications:
      feedMode !== "asean"
        ? top.slice(0, 2).map(
            (h) =>
              `${h.title.slice(0, 60)}… — monitor ASEAN exporters, energy, and consumer durables for knock-on effects.`
          )
        : [],
    watchlist: [],
    method: "rule_based",
  };
}

async function summarizeOvernightNews(headlines, feedMode = "asean") {
  if (headlines.length === 0) {
    return fallbackSummary([], feedMode);
  }

  if (!isAIEnabled()) {
    return fallbackSummary(headlines, feedMode);
  }

  const headlineBlock = headlines
    .slice(0, 10)
    .map(
      (h, i) =>
        `${i + 1}. [${h.feed === "global_spillover" ? "GLOBAL→ASEAN" : "ASEAN"}] ${h.title}${h.source ? ` (${h.source})` : ""}`
    )
    .join("\n");

  const spilloverInstruction =
    feedMode !== "asean"
      ? `Some headlines are US/Europe/global — explicitly explain how each theme could spill into ASEAN equities (e.g. El Niño heatwaves → European AC demand → ASEAN appliance/component exporters; Fed moves → EM flows; commodity shocks → palm oil/LNG/semis).`
      : "";

  try {
    const result = await generateJSON(
      `You are Verita News, the overnight desk for CGS ESG Momentum Engine — an institutional ASEAN ESG equity terminal.
Summarize off-hours and overnight news for portfolio managers. Focus on ESG, sustainability, regulatory, and market-moving stories.
${spilloverInstruction}
Be concise and actionable.`,
      `Overnight/off-hours headline feed (last ${OVERNIGHT_HOURS}h, SGT context). Feed mode: ${feedMode}.

${headlineBlock}

Return JSON:
{
  "title": "short headline for the brief",
  "overview": "2-3 sentence executive summary of overnight themes",
  "bullets": ["3-5 key bullet points"],
  "marketTone": "Bullish" | "Bearish" | "Neutral" | "Mixed",
  "esgHighlights": ["1-3 ESG-specific takeaways"],
  "aseanImplications": ["2-4 bullets on how global/US stories map to ASEAN sectors, tickers, or supply chains"],
  "watchlist": ["tickers or companies to watch, e.g. SEMBCORP.SI"]
}`,
      { maxTokens: 800 }
    );

    return {
      ...result,
      method: "openai",
    };
  } catch {
    return fallbackSummary(headlines, feedMode);
  }
}

export async function getVeritaNewsBundle({ forceRefresh = false } = {}) {
  if (!forceRefresh) {
    const cached = getCached(CACHE_KEY);
    if (cached) return cached;
  }

  const { headlines, feedMode, aseanCount, globalCount } = await fetchOvernightHeadlines();
  const aiSummary = await summarizeOvernightNews(headlines, feedMode);

  const bundle = {
    brand: "Verita News",
    tagline:
      feedMode === "global_spillover"
        ? "US/global spillover wire — mapped to ASEAN market impact"
        : feedMode === "mixed"
          ? "ASEAN wire + global spillover stories"
          : "Overnight & off-hours ASEAN ESG wire",
    overnightWindow: getOvernightWindowLabel(),
    headlines,
    feedMode,
    aseanCount,
    globalCount,
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
      feedMode: bundle.feedMode,
      aseanCount: bundle.aseanCount,
      globalCount: bundle.globalCount,
      tagline: bundle.tagline,
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

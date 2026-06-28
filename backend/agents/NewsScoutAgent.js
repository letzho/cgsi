import { searchWebNews } from "../services/webNews.js";

const NEWS_TEMPLATES = {
  positive: [
    "Regulatory approval for green bond issuance",
    "ASEAN sustainability index inclusion announced",
    "Positive ESG audit from MSCI with rating upgrade signal",
    "Government partnership on renewable energy transition",
    "Strong Q3 earnings beat with ESG-linked KPI outperformance",
  ],
  negative: [
    "Labor compliance investigation opened by regional authority",
    "Supply chain deforestation allegations in media reports",
    "Delayed carbon disclosure filing flagged by exchange",
    "Executive departure amid governance concerns",
    "Environmental fine issued for wastewater violations",
  ],
  neutral: [
    "Routine annual sustainability report published",
    "Industry conference participation on ESG standards",
    "Board committee restructure announced",
    "Quarterly operational update with no ESG material changes",
  ],
};

function seededRandom(seed) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function mockAnalyze(stock) {
  const seed = stock.ticker.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const rand = seededRandom(seed);

  let sentiment;
  let headlines;

  if (stock.baselineEsgScore < 45) {
    sentiment = -0.2 + rand * 1.4;
    headlines = rand > 0.5 ? NEWS_TEMPLATES.positive : NEWS_TEMPLATES.negative;
  } else if (stock.baselineEsgScore > 65) {
    sentiment = -0.6 + rand * 0.8;
    headlines = rand > 0.6 ? NEWS_TEMPLATES.negative : NEWS_TEMPLATES.neutral;
  } else {
    sentiment = -0.5 + rand * 1.0;
    headlines = NEWS_TEMPLATES.neutral;
  }

  sentiment = Math.round(Math.max(-1, Math.min(1, sentiment)) * 100) / 100;

  return {
    agent: "NewsScoutAgent",
    newsSentimentMultiplier: sentiment,
    sentimentLabel:
      sentiment > 0.3 ? "Bullish" : sentiment < -0.3 ? "Bearish" : "Neutral",
    parsedHeadlines: headlines.sort(() => seededRandom(seed) - 0.5).slice(0, 3),
    sourcesScanned: Math.floor(120 + rand * 380),
    source: "mock_fallback",
    live: false,
    processedAt: new Date().toISOString(),
  };
}

export class NewsScoutAgent {
  constructor() {
    this.name = "NewsScoutAgent";
    this.description =
      "Web-search agent: fetches live headlines via Google News RSS and scores ESG sentiment";
  }

  async analyze(stock, { forceRefresh = false } = {}) {
    if (forceRefresh) {
      const { clearCache } = await import("../services/cache.js");
      clearCache(`news:${stock.ticker}`);
    }

    const webResult = await searchWebNews(stock);

    if (webResult.live && webResult.newsSentimentMultiplier !== null) {
      return {
        agent: this.name,
        newsSentimentMultiplier: webResult.newsSentimentMultiplier,
        sentimentLabel: webResult.sentimentLabel,
        parsedHeadlines: webResult.headlines,
        newsItems: webResult.items,
        sourcesScanned: webResult.sourcesScanned,
        searchQuery: webResult.searchQuery,
        source: webResult.source,
        live: true,
        processedAt: new Date().toISOString(),
      };
    }

    const fallback = mockAnalyze(stock);
    return {
      ...fallback,
      webSearchError: webResult.error || "No live headlines — using simulated feed",
    };
  }
}

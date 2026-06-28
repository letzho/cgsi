import { getCached, setCache } from "./cache.js";

const YAHOO_CHART = "https://query1.finance.yahoo.com/v8/finance/chart";

const ASEAN_INDICES = [
  { name: "STI", symbol: "^STI" },
  { name: "KLCI", symbol: "^KLSE" },
  { name: "SET", symbol: "^SET.BK" },
  { name: "JCI", symbol: "^JKSE" },
  { name: "PSEi", symbol: "PSEI.PS" },
  { name: "VN-Index", symbol: "^VNI" },
];

const FALLBACK_INDICES = [
  { name: "STI", value: 3421.85, change: 0.42, changePct: 0.012 },
  { name: "KLCI", value: 1587.32, change: -3.18, changePct: -0.002 },
  { name: "SET", value: 1423.67, change: 5.24, changePct: 0.004 },
  { name: "JCI", value: 7124.5, change: 18.75, changePct: 0.003 },
  { name: "PSEi", value: 6789.12, change: -12.45, changePct: -0.002 },
  { name: "VN-Index", value: 1287.43, change: 8.92, changePct: 0.007 },
];

async function fetchYahooQuote(symbol) {
  const url = `${YAHOO_CHART}/${encodeURIComponent(symbol)}?interval=1d&range=5d`;
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) throw new Error(`Yahoo quote failed: ${symbol}`);

  const json = await res.json();
  const meta = json?.chart?.result?.[0]?.meta;
  if (!meta?.regularMarketPrice) throw new Error(`No price for ${symbol}`);

  const price = meta.regularMarketPrice;
  const prev = meta.chartPreviousClose ?? meta.previousClose ?? price;
  const change = price - prev;
  const changePct = prev !== 0 ? change / prev : 0;

  return {
    symbol,
    price: Math.round(price * 100) / 100,
    change: Math.round(change * 100) / 100,
    changePct: Math.round(changePct * 10000) / 10000,
    currency: meta.currency || "",
    marketState: meta.marketState || "UNKNOWN",
    updatedAt: new Date(meta.regularMarketTime * 1000 || Date.now()).toISOString(),
    source: "yahoo_finance",
  };
}

export async function getLiveIndices() {
  const cached = getCached("market:indices");
  if (cached) return cached;

  const results = await Promise.allSettled(
    ASEAN_INDICES.map(async (idx) => {
      const quote = await fetchYahooQuote(idx.symbol);
      return {
        name: idx.name,
        value: quote.price,
        change: quote.change,
        changePct: quote.changePct,
        source: quote.source,
        updatedAt: quote.updatedAt,
      };
    })
  );

  const live = results
    .filter((r) => r.status === "fulfilled")
    .map((r) => r.value);

  if (live.length === 0) {
    return {
      indices: FALLBACK_INDICES.map((i) => ({ ...i, source: "mock_fallback" })),
      live: false,
    };
  }

  const payload = {
    indices: live,
    live: true,
    updatedAt: new Date().toISOString(),
  };

  setCache("market:indices", payload, 5 * 60 * 1000);
  return payload;
}

export async function getStockQuote(yahooTicker) {
  if (!yahooTicker) return null;

  const cacheKey = `market:stock:${yahooTicker}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const quote = await fetchYahooQuote(yahooTicker);
    const result = {
      ticker: yahooTicker,
      price: quote.price,
      change: quote.change,
      changePct: quote.changePct,
      currency: quote.currency,
      source: quote.source,
      updatedAt: quote.updatedAt,
      live: true,
    };
    setCache(cacheKey, result, 5 * 60 * 1000);
    return result;
  } catch {
    return null;
  }
}

export async function enrichStocksWithQuotes(stocks) {
  const quotes = await Promise.all(
    stocks.map((s) => getStockQuote(s.yahooTicker || s.ticker))
  );

  return stocks.map((stock, i) => {
    const quote = quotes[i];
    if (!quote) {
      return { ...stock, price: null, priceChange: null, priceChangePct: null, priceLive: false };
    }
    return {
      ...stock,
      price: quote.price,
      priceChange: quote.change,
      priceChangePct: quote.changePct,
      priceCurrency: quote.currency,
      priceUpdatedAt: quote.updatedAt,
      priceLive: true,
      priceSource: quote.source,
    };
  });
}

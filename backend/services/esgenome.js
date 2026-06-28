import { getCached, setCache } from "./cache.js";
import {
  CORE_ESG_METRICS,
  PILLAR_WEIGHTS,
  ESGENOME_SOURCES,
} from "../data/esgenomeCoreMetrics.js";

const CACHE_TTL = 15 * 60 * 1000;
const ESGENOME_API_URL = process.env.ESGENOME_API_URL || null;
const ESGENOME_API_KEY = process.env.ESGENOME_API_KEY || null;

function seededRandom(seed) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function sectorProfile(sector) {
  const profiles = {
    Financials: { eBase: 62, sBase: 70, gBase: 78, disclosureRate: 0.92 },
    Utilities: { eBase: 75, sBase: 65, gBase: 72, disclosureRate: 0.88 },
    Telecommunications: { eBase: 58, sBase: 68, gBase: 70, disclosureRate: 0.85 },
    Technology: { eBase: 55, sBase: 72, gBase: 65, disclosureRate: 0.80 },
    Transportation: { eBase: 48, sBase: 62, gBase: 68, disclosureRate: 0.82 },
    Industrials: { eBase: 50, sBase: 60, gBase: 65, disclosureRate: 0.75 },
    Agriculture: { eBase: 52, sBase: 58, gBase: 60, disclosureRate: 0.70 },
    "Consumer Staples": { eBase: 60, sBase: 65, gBase: 68, disclosureRate: 0.83 },
    Hospitality: { eBase: 42, sBase: 55, gBase: 58, disclosureRate: 0.72 },
    Materials: { eBase: 45, sBase: 58, gBase: 62, disclosureRate: 0.78 },
    "Real Estate": { eBase: 50, sBase: 55, gBase: 60, disclosureRate: 0.74 },
    Conglomerate: { eBase: 55, sBase: 62, gBase: 66, disclosureRate: 0.80 },
  };
  return profiles[sector] || { eBase: 55, sBase: 62, gBase: 65, disclosureRate: 0.78 };
}

function generateMetricValue(metric, seed, profile) {
  const rand = seededRandom(seed + metric.id.charCodeAt(0));
  const pillarBase =
    metric.pillar === "Environmental"
      ? profile.eBase
      : metric.pillar === "Social"
        ? profile.sBase
        : profile.gBase;

  const disclosed = rand < profile.disclosureRate;
  const normalizedScore = disclosed
    ? Math.max(20, Math.min(98, pillarBase + (rand - 0.5) * 35))
    : null;

  let rawValue = null;
  if (disclosed) {
    switch (metric.unit) {
      case "tCO2e":
        rawValue = Math.round(50000 + rand * 500000);
        break;
      case "tCO2e/org metric":
        rawValue = round(0.5 + rand * 5, 2);
        break;
      case "MWh or GJ":
        rawValue = Math.round(10000 + rand * 200000);
        break;
      case "MWh or GJ/org metric":
        rawValue = round(0.1 + rand * 2, 2);
        break;
      case "ML or m³":
        rawValue = Math.round(100 + rand * 5000);
        break;
      case "ML or m³/org metric":
        rawValue = round(0.01 + rand * 0.5, 3);
        break;
      case "t":
        rawValue = Math.round(500 + rand * 10000);
        break;
      case "%":
        rawValue = round(20 + rand * 60, 1);
        break;
      case "Number and %":
        rawValue = { count: Math.round(50 + rand * 500), rate: round(5 + rand * 15, 1) };
        break;
      case "Number":
        rawValue = Math.round(1000 + rand * 50000);
        break;
      case "Hours/employee":
        rawValue = round(10 + rand * 40, 1);
        break;
      case "Cases":
        rawValue = Math.round(rand * 5);
        break;
      case "Discussion + standards":
        rawValue = rand > 0.3 ? "GRI 205-1/205-2/205-3 disclosed" : "Partial disclosure";
        break;
      case "List":
        rawValue = ["ISO 14001", "ISO 45001", "BCA Green Mark"].slice(0, Math.ceil(rand * 3));
        break;
      case "GRI/TCFD/SASB/SDGs":
        rawValue = ["GRI", "TCFD", rand > 0.5 ? "SASB" : null].filter(Boolean);
        break;
      case "Internal/External/None":
        rawValue = rand > 0.6 ? "External" : rand > 0.3 ? "Internal" : "None";
        break;
      default:
        rawValue = disclosed ? "Disclosed" : null;
    }
  }

  return {
    metricId: metric.id,
    topic: metric.topic,
    metric: metric.metric,
    unit: metric.unit,
    pillar: metric.pillar,
    frameworks: metric.frameworks,
    disclosed,
    normalizedScore: normalizedScore != null ? round(normalizedScore, 1) : null,
    rawValue,
    weight: metric.weight,
    reportingPeriod: "FY2024",
  };
}

function computePillarScores(metrics) {
  const pillars = { Environmental: [], Social: [], Governance: [] };
  for (const m of metrics) {
    if (m.normalizedScore != null) pillars[m.pillar].push(m);
  }

  const scores = {};
  for (const [pillar, items] of Object.entries(pillars)) {
    if (items.length === 0) {
      scores[pillar] = 0;
      continue;
    }
    const totalWeight = items.reduce((s, m) => s + m.weight, 0);
    scores[pillar] = round(
      items.reduce((s, m) => s + m.normalizedScore * (m.weight / totalWeight), 0),
      1
    );
  }
  return scores;
}

function computeCompositeScore(pillarScores) {
  return round(
    pillarScores.Environmental * PILLAR_WEIGHTS.Environmental +
      pillarScores.Social * PILLAR_WEIGHTS.Social +
      pillarScores.Governance * PILLAR_WEIGHTS.Governance,
    1
  );
}

function generateESGenomeDisclosure(stock) {
  const seed = stock.ticker.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const profile = sectorProfile(stock.sector);

  const metrics = CORE_ESG_METRICS.map((m) => generateMetricValue(m, seed, profile));
  const disclosedCount = metrics.filter((m) => m.disclosed).length;
  const pillarScores = computePillarScores(metrics);
  const compositeScore = computeCompositeScore(pillarScores);

  return {
    source: ESGENOME_SOURCES.portal,
    portal: "ESGenome (Joint SGX & MAS)",
    ticker: stock.ticker,
    company: stock.company,
    sector: stock.sector,
    country: stock.country,
    coreMetricsCount: CORE_ESG_METRICS.length,
    metricsDisclosed: disclosedCount,
    disclosureRate: round((disclosedCount / CORE_ESG_METRICS.length) * 100, 1),
    metrics,
    pillarScores,
    compositeScore,
    frameworksMapped: ["GRI", "TCFD", "SASB", "WEF", "SGX-ST LR 711A/711B"],
    lastReportedAt: new Date(Date.now() - seededRandom(seed) * 90 * 86400000).toISOString(),
    live: false,
    dataOrigin: "structured_disclosure_simulation",
  };
}

async function fetchLiveESGenome(stock) {
  if (!ESGENOME_API_URL) return null;

  try {
    const headers = { Accept: "application/json" };
    if (ESGENOME_API_KEY) headers.Authorization = `Bearer ${ESGENOME_API_KEY}`;

    const url = `${ESGENOME_API_URL}/disclosures/${encodeURIComponent(stock.ticker)}`;
    const res = await fetch(url, { headers, signal: AbortSignal.timeout(10000) });
    if (!res.ok) return null;

    const data = await res.json();
    return { ...data, live: true, dataOrigin: "esgenome_api" };
  } catch {
    return null;
  }
}

export async function fetchESGenomeDisclosure(stock, { forceRefresh = false } = {}) {
  const cacheKey = `esgenome:${stock.ticker}`;
  if (!forceRefresh) {
    const cached = getCached(cacheKey);
    if (cached) return cached;
  }

  const live = await fetchLiveESGenome(stock);
  const result = live || generateESGenomeDisclosure(stock);
  setCache(cacheKey, result, CACHE_TTL);
  return result;
}

export async function fetchESGenomeBatch(stocks, options = {}) {
  return Promise.all(stocks.map((s) => fetchESGenomeDisclosure(s, options)));
}

function round(n, d = 1) {
  const f = 10 ** d;
  return Math.round(n * f) / f;
}

export { CORE_ESG_METRICS, ESGENOME_SOURCES, computePillarScores, computeCompositeScore };

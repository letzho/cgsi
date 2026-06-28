import { getCached, setCache } from "./cache.js";
import { ESGENOME_SOURCES } from "../data/esgenomeCoreMetrics.js";

const CACHE_TTL = 10 * 60 * 1000;
const SGXFIRST_API_URL = process.env.SGXFIRST_API_URL || null;
const SGXFIRST_BASE = "https://sgx.com/first";

function seededRandom(seed) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

const SGXFIRST_PILLARS = [
  {
    id: "climate",
    name: "Climate Action",
    description: "Transition pathways, emissions targets, and climate risk disclosure",
  },
  {
    id: "social",
    name: "Social Impact",
    description: "Workforce, community, and supply chain human rights",
  },
  {
    id: "governance",
    name: "Governance Excellence",
    description: "Board oversight, ethics, and sustainability-linked remuneration",
  },
  {
    id: "innovation",
    name: "Green Innovation",
    description: "R&D, green patents, and circular economy initiatives",
  },
];

function generateSGXFIRSTProfile(stock, esgenomeDisclosure) {
  const seed = stock.ticker.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const rand = seededRandom(seed);

  const pillarScores = esgenomeDisclosure?.pillarScores || {
    Environmental: 55,
    Social: 62,
    Governance: 65,
  };

  const firstScore = Math.round(
    (pillarScores.Environmental * 0.3 +
      pillarScores.Social * 0.25 +
      pillarScores.Governance * 0.25 +
      (50 + rand * 40) * 0.2) *
      10
  ) / 10;

  const commitments = [
    { target: "Net Zero by 2050", status: rand > 0.4 ? "Committed" : "Under Review", year: 2050 },
    { target: "Scope 1 & 2 reduction 30% by 2030", status: rand > 0.3 ? "On Track" : "Planning", year: 2030 },
    { target: "Board gender diversity ≥ 30%", status: pillarScores.Governance > 65 ? "Achieved" : "In Progress", year: 2026 },
  ];

  const initiatives = SGXFIRST_PILLARS.map((p, i) => ({
    pillar: p.name,
    score: Math.round((firstScore + (seededRandom(seed + i) - 0.5) * 15) * 10) / 10,
    highlight:
      i === 0
        ? "TCFD-aligned climate scenario analysis published"
        : i === 1
          ? "Living wage policy extended to tier-1 suppliers"
          : i === 2
            ? "Sustainability committee with independent chair"
            : "Green patent filings up 18% YoY",
  }));

  return {
    source: "SGXFIRST",
    portalUrl: SGXFIRST_BASE,
    program: "Reshaping Sustainability Together",
    ticker: stock.ticker,
    company: stock.company,
    firstScore,
    firstRating: firstScore >= 75 ? "Leader" : firstScore >= 55 ? "Progressive" : "Emerging",
    pillars: initiatives,
    sustainabilityCommitments: commitments,
    peerBenchmarkPercentile: Math.round(40 + rand * 50),
    alignedWithESGenome: true,
    esgenomeMetricsLinked: esgenomeDisclosure?.metricsDisclosed ?? 0,
    lastUpdatedAt: new Date().toISOString(),
    live: false,
    dataOrigin: "sgxfirst_simulation",
  };
}

async function fetchLiveSGXFIRST(stock) {
  if (!SGXFIRST_API_URL) return null;

  try {
    const url = `${SGXFIRST_API_URL}/companies/${encodeURIComponent(stock.ticker)}`;
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return { ...data, live: true, dataOrigin: "sgxfirst_api", portalUrl: SGXFIRST_BASE };
  } catch {
    return null;
  }
}

export async function fetchSGXFIRSTProfile(stock, esgenomeDisclosure = null, { forceRefresh = false } = {}) {
  const cacheKey = `sgxfirst:${stock.ticker}`;
  if (!forceRefresh) {
    const cached = getCached(cacheKey);
    if (cached) return cached;
  }

  const live = await fetchLiveSGXFIRST(stock);
  const result = live || generateSGXFIRSTProfile(stock, esgenomeDisclosure);
  setCache(cacheKey, result, CACHE_TTL);
  return result;
}

export { SGXFIRST_PILLARS, SGXFIRST_BASE, ESGENOME_SOURCES };

/**
 * Global ESG rating methodology definitions for cross-reference against
 * SGX ESGenome 27-metric baseline.
 */

export const COMPARISON_PROVIDERS = ["msci", "sp_global", "sustainalytics"];

export const METHODOLOGIES = {
  sgxEsGenome: {
    id: "sgx_esgenome",
    name: "SGX ESGenome (27 Core Metrics)",
    provider: "SGX Group & MAS",
    scale: "0–100 composite",
    description:
      "Clean corporate starting point: weighted composite of 27 quantitative Core ESG Metrics aligned to GRI, TCFD, SASB, and WEF.",
    formula: "Σ(metricScore × metricWeight) per pillar, then E×0.35 + S×0.35 + G×0.30",
    referenceUrl: "https://www.sgx.com/regulation/sustainability-reporting",
    role: "baseline",
  },

  msci: {
    id: "msci",
    name: "MSCI ESG Ratings",
    provider: "MSCI ESG Research",
    scale: "AAA–CCC (industry-relative)",
    description:
      "Scores companies on an industry-relative scale from AAA (best) to CCC (worst). Evaluates unique risk exposure based on Global Industry Classification Standard (GICS) sector materiality.",
    formula:
      "GICS-weighted Key Issue scores (0–10) × sector materiality weights − controversy penalty",
    pillarWeights: { Environmental: 0.33, Social: 0.33, Governance: 0.34 },
    keyIssueBias: { Environmental: 1.15, Social: 0.95, Governance: 1.05 },
    controversyPenaltyMax: 10,
    letterMap: {
      AAA: 100, AA: 92, A: 84, BBB: 76, BB: 68, B: 60, CCC: 45,
    },
    referenceUrl: "https://www.msci.com/our-solutions/esg-investing/esg-ratings",
    role: "cross_reference",
    lowerIsBetter: false,
  },

  sp_global: {
    id: "sp_global",
    name: "S&P Global ESG Score",
    provider: "S&P Global",
    scale: "0–100",
    description:
      "Scores companies on a 0–100 metric, leaning heavily on Corporate Sustainability Assessment (CSA) questionnaires and public disclosures.",
    formula:
      "ESG Score = CSA questionnaire weight (60%) + public disclosure completeness (40%) − controversy adjustment",
    csaWeight: 0.6,
    disclosureWeight: 0.4,
    controversyAdjustmentMax: 12,
    referenceUrl: "https://www.spglobal.com/esg/scores",
    role: "cross_reference",
    lowerIsBetter: false,
  },

  sustainalytics: {
    id: "sustainalytics",
    name: "Morningstar Sustainalytics",
    provider: "Morningstar Sustainalytics",
    scale: "0–100 Unmanaged ESG Risk (lower is better)",
    description:
      "Measures Unmanaged ESG Risk on an absolute scale. A lower score is better: 0–10 is negligible risk, 20–30 is medium, 40+ is severe.",
    formula: "Unmanaged ESG Risk = Material Risk Exposure − Management Quality",
    riskCategories: {
      negligible: { max: 10, label: "Negligible" },
      low: { max: 20, label: "Low" },
      medium: { max: 30, label: "Medium" },
      high: { max: 40, label: "High" },
      severe: { max: 100, label: "Severe" },
    },
    exposureWeight: 0.55,
    managementWeight: 0.45,
    referenceUrl: "https://www.sustainalytics.com/esg-ratings",
    role: "cross_reference",
    lowerIsBetter: true,
  },
};

const SECTOR_TO_GICS = {
  Financials: "Financials",
  Utilities: "Utilities",
  Telecommunications: "Communication Services",
  Technology: "Information Technology",
  Transportation: "Industrials",
  Industrials: "Industrials",
  Agriculture: "Consumer Staples",
  "Consumer Staples": "Consumer Staples",
  Hospitality: "Consumer Discretionary",
  Materials: "Materials",
  "Real Estate": "Real Estate",
  Conglomerate: "Industrials",
};

export function getGicsSector(sector) {
  return SECTOR_TO_GICS[sector] || "General";
}

export function normalizeComparisonProvider(id) {
  if (!id || !COMPARISON_PROVIDERS.includes(id)) return "msci";
  return id;
}

export function computeProviderScore(providerId, pillarScores, { seed = 0, sector = "General" } = {}) {
  const { Environmental: E, Social: S, Governance: G } = pillarScores;
  const noise = ((Math.sin(seed * 7.3) + 1) / 2) * 8 - 4;

  switch (providerId) {
    case "sgx_esgenome":
      return round(E * 0.35 + S * 0.35 + G * 0.3);

    case "msci": {
      const m = METHODOLOGIES.msci;
      const gicsAdj = sector === "Financials" ? 1.08 : sector === "Utilities" ? 1.05 : 1.0;
      const adjE = E * m.keyIssueBias.Environmental * gicsAdj;
      const adjS = S * m.keyIssueBias.Social;
      const adjG = G * m.keyIssueBias.Governance;
      const raw =
        (adjE * m.pillarWeights.Environmental +
          adjS * m.pillarWeights.Social +
          adjG * m.pillarWeights.Governance) /
        1.05;
      const controversy = ((Math.sin(seed * 3.1) + 1) / 2) * m.controversyPenaltyMax;
      return round(Math.max(0, Math.min(100, raw - controversy + noise * 0.5)));
    }

    case "sp_global": {
      const sp = METHODOLOGIES.sp_global;
      const csaComponent = (E * 0.35 + S * 0.3 + G * 0.35) * sp.csaWeight;
      const disclosureCompleteness =
        ((Math.sin(seed * 5.7) + 1) / 2) * 100 * sp.disclosureWeight;
      const controversy = ((Math.sin(seed * 2.3) + 1) / 2) * sp.controversyAdjustmentMax;
      return round(Math.max(0, Math.min(100, csaComponent + disclosureCompleteness * 0.4 - controversy + noise)));
    }

    case "sustainalytics": {
      const s = METHODOLOGIES.sustainalytics;
      const exposure = 100 - (E * 0.4 + S * 0.35 + G * 0.25);
      const management = E * 0.3 + S * 0.35 + G * 0.35;
      const risk = exposure * s.exposureWeight + (100 - management) * s.managementWeight;
      const sectorAdj = sector === "Financials" ? -2 : sector === "Utilities" ? 2 : 0;
      return round(Math.max(0, Math.min(100, risk + sectorAdj + noise * 0.5)));
    }

    default:
      return round((E + S + G) / 3);
  }
}

export function msciLetterFromScore(score) {
  if (score >= 96) return "AAA";
  if (score >= 88) return "AA";
  if (score >= 80) return "A";
  if (score >= 72) return "BBB";
  if (score >= 64) return "BB";
  if (score >= 56) return "B";
  return "CCC";
}

export function sustainalyticsCategoryFromRisk(riskScore) {
  const cats = METHODOLOGIES.sustainalytics.riskCategories;
  if (riskScore <= cats.negligible.max) return cats.negligible.label;
  if (riskScore <= cats.low.max) return cats.low.label;
  if (riskScore <= cats.medium.max) return cats.medium.label;
  if (riskScore <= cats.high.max) return cats.high.label;
  return cats.severe.label;
}

/** Normalize provider score to 0–100 quality scale for cross-provider divergence. */
export function toComparableScore(providerId, nativeScore) {
  if (providerId === "sustainalytics") {
    return round(100 - nativeScore);
  }
  return nativeScore;
}

export function buildCrossReferenceEntry(providerId, nativeScore, sgxBaseline, extra = {}) {
  const meta = METHODOLOGIES[providerId];
  const deltaFromSGX = round(nativeScore - sgxBaseline);

  const base = {
    providerId,
    provider: meta.name,
    score: nativeScore,
    deltaFromSGX,
    formula: meta.formula,
    scale: meta.scale,
    description: meta.description,
    lowerIsBetter: meta.lowerIsBetter ?? false,
    ...extra,
  };

  if (providerId === "msci") {
    return {
      ...base,
      letterRating: msciLetterFromScore(nativeScore),
      gicsSector: extra.gicsSector,
    };
  }

  if (providerId === "sp_global") {
    return {
      ...base,
      esgScore: nativeScore,
      csaComponent: extra.csaComponent,
    };
  }

  if (providerId === "sustainalytics") {
    return {
      ...base,
      riskScore: nativeScore,
      category: sustainalyticsCategoryFromRisk(nativeScore),
      displayNote: "Lower risk score is better",
    };
  }

  return base;
}

export function buildSelectedComparison(crossReference, providerId, sgxBaseline) {
  const id = normalizeComparisonProvider(providerId);
  const entry = crossReference[id];
  const meta = METHODOLOGIES[id];

  const velocityDelta = entry.lowerIsBetter
    ? round(sgxBaseline - entry.riskScore)
    : round(entry.score - sgxBaseline);

  let displayValue;
  if (id === "msci") {
    displayValue = `${entry.letterRating} (${entry.score})`;
  } else if (id === "sustainalytics") {
    displayValue = `${entry.riskScore} risk · ${entry.category}`;
  } else {
    displayValue = `${entry.score}/100`;
  }

  return {
    providerId: id,
    provider: meta.name,
    scale: meta.scale,
    description: meta.description,
    displayValue,
    entry,
    velocityDelta,
    divergenceFromBaseline: entry.deltaFromSGX,
    lowerIsBetter: entry.lowerIsBetter ?? false,
  };
}

export function computeProviderDivergence(crossReference) {
  const comparable = COMPARISON_PROVIDERS.map((id) =>
    toComparableScore(id, crossReference[id].score ?? crossReference[id].riskScore)
  );
  const mean = comparable.reduce((a, b) => a + b, 0) / comparable.length;
  const variance = comparable.reduce((a, v) => a + (v - mean) ** 2, 0) / comparable.length;
  const stdDev = Math.sqrt(variance);
  const spread = Math.max(...comparable) - Math.min(...comparable);
  return {
    mean: round(mean),
    stdDev: round(stdDev),
    spread: round(spread),
    label: spread > 20 ? "High Divergence" : spread > 10 ? "Moderate Divergence" : "Low Divergence",
  };
}

export function computeVelocityOfChange(sgxBaseline, realtimeScore, priorScore = null) {
  const delta = realtimeScore - sgxBaseline;
  const deltaPct = (delta / Math.max(sgxBaseline, 1)) * 100;
  const momentum = priorScore != null ? realtimeScore - priorScore : delta * 0.3;
  return {
    absoluteDelta: round(delta),
    percentDelta: round(deltaPct),
    momentum: round(momentum),
    direction: delta > 2 ? "Accelerating" : delta < -2 ? "Decelerating" : "Stable",
    signal: deltaPct > 15 ? "Breakout" : deltaPct > 5 ? "Positive Drift" : deltaPct < -10 ? "Deteriorating" : "In-Line",
  };
}

function round(n) {
  return Math.round(n * 10) / 10;
}

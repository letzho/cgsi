import { fetchESGenomeDisclosure } from "../services/esgenome.js";
import { fetchSGXFIRSTProfile } from "../services/sgxFirst.js";
import {
  METHODOLOGIES,
  COMPARISON_PROVIDERS,
  computeProviderScore,
  buildCrossReferenceEntry,
  buildSelectedComparison,
  computeProviderDivergence,
  computeVelocityOfChange,
  getGicsSector,
  normalizeComparisonProvider,
} from "../data/esgMethodologies.js";

const velocityHistory = new Map();

function tickerSeed(ticker) {
  return ticker.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
}

export class ESGBaselineAgent {
  constructor() {
    this.name = "ESGBaselineAgent";
    this.description =
      "Streams SGX ESGenome 27-metric baseline and cross-references MSCI, S&P Global, and Sustainalytics to compute ESG velocity of change";
  }

  async analyze(stock, { forceRefresh = false, newsSentiment = 0, comparisonProvider = "msci" } = {}) {
    const esgenome = await fetchESGenomeDisclosure(stock, { forceRefresh });
    const sgxFirst = await fetchSGXFIRSTProfile(stock, esgenome, { forceRefresh });

    const seed = tickerSeed(stock.ticker);
    const pillarScores = esgenome.pillarScores;
    const sgxBaseline = esgenome.compositeScore;
    const gicsSector = getGicsSector(stock.sector);
    const selectedId = normalizeComparisonProvider(comparisonProvider);

    const msciScore = computeProviderScore("msci", pillarScores, { seed, sector: stock.sector });
    const spScore = computeProviderScore("sp_global", pillarScores, { seed, sector: stock.sector });
    const susRisk = computeProviderScore("sustainalytics", pillarScores, { seed, sector: stock.sector });

    const crossReference = {
      msci: buildCrossReferenceEntry("msci", msciScore, sgxBaseline, { gicsSector }),
      sp_global: buildCrossReferenceEntry("sp_global", spScore, sgxBaseline, {
        csaComponent: round(spScore * 0.6),
      }),
      sustainalytics: buildCrossReferenceEntry("sustainalytics", susRisk, sgxBaseline),
    };

    const priorKey = `${stock.ticker}:${selectedId}`;
    const priorScore = velocityHistory.get(priorKey)?.realtimeScore ?? null;

    const sentimentAdj = newsSentiment * 5;
    const sgxFirstAdj = (sgxFirst.firstScore - sgxBaseline) * 0.15;
    const selected = buildSelectedComparison(crossReference, selectedId, sgxBaseline);
    const providerDrift = selected.velocityDelta * 0.08;

    const realtimeScore = round(
      Math.max(0, Math.min(100, sgxBaseline + sentimentAdj + sgxFirstAdj + providerDrift))
    );

    velocityHistory.set(priorKey, { realtimeScore, timestamp: Date.now() });

    const velocity = computeVelocityOfChange(sgxBaseline, realtimeScore, priorScore);
    const divergence = computeProviderDivergence(crossReference);
    const problemStatement = buildProblemStatement(stock, sgxBaseline, crossReference, divergence, selected);

    return {
      agent: this.name,
      baselineStandard: "SGX ESGenome 27 Core Metrics",
      baselineEsgScore: sgxBaseline,
      realtimeEsgScore: realtimeScore,
      pillarScores,
      comparisonProvider: selectedId,
      selectedComparison: selected,
      availableComparisons: COMPARISON_PROVIDERS.map((id) => ({
        id,
        name: METHODOLOGIES[id].name,
        scale: METHODOLOGIES[id].scale,
        description: METHODOLOGIES[id].description,
        lowerIsBetter: METHODOLOGIES[id].lowerIsBetter ?? false,
      })),
      esgenome: {
        portal: esgenome.portal,
        coreMetricsCount: esgenome.coreMetricsCount,
        metricsDisclosed: esgenome.metricsDisclosed,
        disclosureRate: esgenome.disclosureRate,
        frameworksMapped: esgenome.frameworksMapped,
        metrics: esgenome.metrics,
        lastReportedAt: esgenome.lastReportedAt,
        live: esgenome.live,
      },
      sgxFirst: {
        portalUrl: sgxFirst.portalUrl,
        firstScore: sgxFirst.firstScore,
        firstRating: sgxFirst.firstRating,
        pillars: sgxFirst.pillars,
        sustainabilityCommitments: sgxFirst.sustainabilityCommitments,
        peerBenchmarkPercentile: sgxFirst.peerBenchmarkPercentile,
        live: sgxFirst.live,
      },
      crossReference,
      providerDivergence: divergence,
      velocityOfChange: velocity,
      problemStatement,
      calculationEdge: {
        summary: `SGX ESGenome 27-metric baseline vs ${selected.provider} — velocity of change detected before ${selected.provider} re-rates.`,
        baselineSource: "ESGenome (SGX & MAS)",
        comparisonProvider: selected.provider,
        velocitySignal: velocity.signal,
        velocityDirection: velocity.direction,
        sentimentContribution: round(sentimentAdj),
        sgxFirstContribution: round(sgxFirstAdj),
        providerDriftContribution: round(providerDrift),
      },
      methodologies: Object.values(METHODOLOGIES).map((m) => ({
        id: m.id,
        name: m.name,
        scale: m.scale,
        description: m.description,
        role: m.role,
        lowerIsBetter: m.lowerIsBetter ?? false,
      })),
      source: esgenome.live || sgxFirst.live ? "live_api" : "structured_simulation",
      live: esgenome.live || sgxFirst.live,
      processedAt: new Date().toISOString(),
    };
  }
}

function buildProblemStatement(stock, sgxBaseline, crossReference, divergence, selected) {
  const { msci, sp_global, sustainalytics } = crossReference;
  return (
    `${stock.company} SGX ESGenome baseline: ${sgxBaseline}/100 (27 Core Metrics). ` +
    `Selected comparison — ${selected.provider}: ${selected.displayValue} (Δ ${selected.divergenceFromBaseline > 0 ? "+" : ""}${selected.divergenceFromBaseline} vs SGX). ` +
    `All providers: MSCI ${msci.letterRating} [GICS: ${msci.gicsSector}], ` +
    `S&P Global ${sp_global.score}/100, ` +
    `Sustainalytics ${sustainalytics.riskScore} risk (${sustainalytics.category}). ` +
    `Cross-provider spread: ${divergence.spread} pts (${divergence.label}) — global raters produce wildly different scores from the same disclosures.`
  );
}

function round(n) {
  return Math.round(n * 10) / 10;
}

export function getVelocityHistory() {
  return Object.fromEntries(velocityHistory);
}

export function clearVelocityHistory() {
  velocityHistory.clear();
}

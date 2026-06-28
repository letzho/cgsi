import { ESGBaselineAgent } from "./ESGBaselineAgent.js";
import { NewsScoutAgent } from "./NewsScoutAgent.js";
import { InnovationAnalystAgent } from "./InnovationAnalystAgent.js";
import { PortfolioOrchestratorAgent } from "./PortfolioOrchestratorAgent.js";
import { GenerativeAnalystAgent } from "./GenerativeAnalystAgent.js";
import { CrowdSentimentAgent } from "./CrowdSentimentAgent.js";
import { mockStocks } from "../data/stocks.js";
import { enrichStocksWithQuotes, getLiveIndices } from "../services/marketData.js";
import { clearCache } from "../services/cache.js";
import { isAIEnabled } from "../services/llm.js";
import { getCommentsForTicker } from "../services/forum.js";

const esgBaselineAgent = new ESGBaselineAgent();
const newsAgent = new NewsScoutAgent();
const innovationAgent = new InnovationAnalystAgent();
const orchestratorAgent = new PortfolioOrchestratorAgent();
const generativeAgent = new GenerativeAnalystAgent();
const crowdAgent = new CrowdSentimentAgent();

const analysisCache = new Map();

export async function runAgentPipeline(stock, { forceRefresh = false, comparisonProvider = "msci" } = {}) {
  const cacheKey = `${stock.ticker}:${comparisonProvider}`;

  if (forceRefresh) {
    analysisCache.delete(cacheKey);
    clearCache(`news:${stock.ticker}`);
    clearCache(`esgenome:${stock.ticker}`);
    clearCache(`sgxfirst:${stock.ticker}`);
    clearCache(`genai:${stock.ticker}`);
    clearCache(`market:stock:${stock.yahooTicker || stock.ticker}`);
  }

  const newsOutput = await newsAgent.analyze(stock, { forceRefresh });
  const esgBaselineOutput = await esgBaselineAgent.analyze(stock, {
    forceRefresh,
    newsSentiment: newsOutput.newsSentimentMultiplier,
    comparisonProvider,
  });

  const enrichedStock = {
    ...stock,
    baselineEsgScore: esgBaselineOutput.baselineEsgScore,
    sgxEsGenomeBaseline: esgBaselineOutput.baselineEsgScore,
    esgVelocity: esgBaselineOutput.velocityOfChange,
  };

  const innovationOutput = innovationAgent.analyze(enrichedStock);
  const forumComments = await getCommentsForTicker(stock.ticker);
  const crowdOutput = crowdAgent.analyze(enrichedStock, forumComments);
  const orchestratorOutput = orchestratorAgent.orchestrate(
    enrichedStock,
    newsOutput,
    innovationOutput,
    esgBaselineOutput,
    crowdOutput
  );

  const agentOutputs = {
    esgBaseline: esgBaselineOutput,
    newsScout: newsOutput,
    innovationAnalyst: innovationOutput,
    crowdSentiment: crowdOutput,
    portfolioOrchestrator: orchestratorOutput,
  };

  const runGenerative = isAIEnabled() && (forceRefresh || process.env.AI_THESIS_ON_LOAD === "true");
  const generativeOutput = runGenerative
    ? await generativeAgent.analyze(enrichedStock, agentOutputs, { forceRefresh })
    : generativeAgent.fallback(enrichedStock, agentOutputs);

  const [enriched] = await enrichStocksWithQuotes([stock]);
  const market = enriched.price != null
    ? {
        price: enriched.price,
        priceChange: enriched.priceChange,
        priceChangePct: enriched.priceChangePct,
        priceCurrency: enriched.priceCurrency,
        priceUpdatedAt: enriched.priceUpdatedAt,
        priceLive: enriched.priceLive,
        priceSource: enriched.priceSource,
      }
    : { price: null, priceLive: false };

  const result = {
    ...enrichedStock,
    ...market,
    agents: {
      ...agentOutputs,
      generativeAnalyst: generativeOutput,
    },
    cgsDynamicMomentumScore: orchestratorOutput.cgsDynamicMomentumScore,
    momentumRateOfChange: orchestratorOutput.momentumRateOfChange,
    momentumRating: orchestratorOutput.momentumRating,
    quadrant: orchestratorOutput.quadrant,
    quadrantId: orchestratorOutput.quadrantId,
    quadrantDescription: orchestratorOutput.quadrantDescription,
    quadrantColor: orchestratorOutput.quadrantColor,
    actionSignal: orchestratorOutput.actionSignal,
    investmentThesis: generativeOutput.aiPowered
      ? generativeOutput.thesis
      : orchestratorOutput.investmentThesis,
    esgInsight: generativeOutput.esgInsight || null,
    aiPoweredThesis: generativeOutput.aiPowered ?? false,
    esgTrajectory: orchestratorOutput.esgTrajectory,
    analyzedAt: new Date().toISOString(),
  };

  analysisCache.set(cacheKey, result);
  return result;
}

export async function analyzeAllStocks({ forceRefresh = false, comparisonProvider = "msci" } = {}) {
  if (forceRefresh) {
    analysisCache.clear();
    clearCache("news:");
    clearCache("esgenome:");
    clearCache("sgxfirst:");
    clearCache("market:");
  }

  const results = await Promise.all(
    mockStocks.map(async (stock) => {
      const cacheKey = `${stock.ticker}:${comparisonProvider}`;
      if (!forceRefresh && analysisCache.has(cacheKey)) {
        return analysisCache.get(cacheKey);
      }
      return runAgentPipeline(stock, { forceRefresh, comparisonProvider });
    })
  );

  return results;
}

export async function analyzeStockByTicker(ticker, options = {}) {
  const stock = mockStocks.find(
    (s) => s.ticker.toLowerCase() === ticker.toLowerCase()
  );
  if (!stock) return null;
  return runAgentPipeline(stock, options);
}

export async function getAlphaBasket() {
  const stocks = await analyzeAllStocks();
  return stocks.filter((s) => s.quadrantId === "hidden_winners");
}

export async function getGlobalIndices() {
  const data = await getLiveIndices();
  return data.indices;
}

export function getMarketMeta() {
  const cached = analysisCache.size;
  return { cachedStocks: cached };
}

export function invalidateStockAnalysis(ticker) {
  if (!ticker) return;
  const prefix = `${ticker.toLowerCase()}:`;
  for (const key of analysisCache.keys()) {
    if (key.toLowerCase().startsWith(prefix)) {
      analysisCache.delete(key);
    }
  }
}

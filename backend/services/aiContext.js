import { analyzeAllStocks, getAlphaBasket } from "../agents/pipeline.js";
import { mockStocks } from "../data/stocks.js";

export async function buildGuideContext(context = {}) {
  const stocks = await analyzeAllStocks({
    comparisonProvider: context.comparisonProvider || "msci",
  });
  const basket = stocks.filter((s) => s.quadrantId === "hidden_winners");

  const byQuadrant = {};
  stocks.forEach((s) => {
    byQuadrant[s.quadrant] = (byQuadrant[s.quadrant] || 0) + 1;
  });

  let selectedStock = null;
  if (context.selectedTicker) {
    selectedStock = stocks.find(
      (s) => s.ticker.toLowerCase() === context.selectedTicker.toLowerCase()
    );
  }

  return {
    page: context.page || "dashboard",
    universeSize: stocks.length,
    hiddenWinnersCount: basket.length,
    quadrantBreakdown: byQuadrant,
    hiddenWinners: basket.map((s) => ({
      ticker: s.ticker,
      company: s.company,
      baselineEsg: s.baselineEsgScore,
      momentumScore: s.cgsDynamicMomentumScore,
      signal: s.actionSignal,
    })),
    selectedStock: selectedStock
      ? summarizeStockForAI(selectedStock)
      : null,
    tickers: mockStocks.map((s) => s.ticker),
  };
}

export function summarizeStockForAI(stock) {
  const esg = stock.agents?.esgBaseline;
  return {
    ticker: stock.ticker,
    company: stock.company,
    sector: stock.sector,
    country: stock.country,
    price: stock.price,
    priceLive: stock.priceLive,
    baselineEsgScore: stock.baselineEsgScore,
    cgsDynamicMomentumScore: stock.cgsDynamicMomentumScore,
    momentumRateOfChange: stock.momentumRateOfChange,
    quadrant: stock.quadrant,
    actionSignal: stock.actionSignal,
    investmentThesis: stock.investmentThesis,
    esgBaseline: esg
      ? {
          sgxEsGenomeScore: esg.baselineEsgScore,
          metricsDisclosed: esg.esgenome?.metricsDisclosed,
          velocitySignal: esg.velocityOfChange?.signal,
          providerDivergence: esg.providerDivergence?.spread,
          msci: esg.crossReference?.msci,
          spGlobal: esg.crossReference?.sp_global,
          sustainalytics: esg.crossReference?.sustainalytics,
          problemStatement: esg.problemStatement,
        }
      : null,
    newsSentiment: stock.agents?.newsScout?.newsSentimentMultiplier,
    newsHeadlines: stock.agents?.newsScout?.parsedHeadlines?.slice(0, 3),
    digitalMaturity: stock.agents?.innovationAnalyst?.digitalAiMaturityIndex,
    generativeThesis: stock.agents?.generativeAnalyst?.thesis || null,
  };
}

export function buildGenerativeContext(stock, agentOutputs) {
  const { esgBaseline, newsScout, innovationAnalyst, portfolioOrchestrator } = agentOutputs;
  return {
    company: stock.company,
    ticker: stock.ticker,
    sector: stock.sector,
    country: stock.country,
    sgxEsGenomeBaseline: esgBaseline?.baselineEsgScore,
    esgVelocity: esgBaseline?.velocityOfChange,
    providerDivergence: esgBaseline?.providerDivergence,
    crossReference: esgBaseline?.crossReference,
    newsSentiment: newsScout?.newsSentimentMultiplier,
    headlines: newsScout?.parsedHeadlines,
    digitalMaturity: innovationAnalyst?.digitalAiMaturityIndex,
    patents: innovationAnalyst?.recentPatents,
    orchestrator: {
      dynamicScore: portfolioOrchestrator?.cgsDynamicMomentumScore,
      quadrant: portfolioOrchestrator?.quadrant,
      actionSignal: portfolioOrchestrator?.actionSignal,
      templateThesis: portfolioOrchestrator?.investmentThesis,
    },
  };
}

export async function getAlphaBasketSummary() {
  const basket = await getAlphaBasket();
  return basket.map((s) => summarizeStockForAI(s));
}

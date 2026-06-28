import { EventEmitter } from "events";
import { mockStocks } from "../data/stocks.js";
import { ESGBaselineAgent } from "../agents/ESGBaselineAgent.js";

const esgStreamEmitter = new EventEmitter();
esgStreamEmitter.setMaxListeners(50);

const esgBaselineAgent = new ESGBaselineAgent();
let streamInterval = null;
const subscribers = new Set();

const STREAM_INTERVAL_MS = parseInt(process.env.ESG_STREAM_INTERVAL_MS || "5000", 10);

async function emitESGUpdate(ticker = null) {
  const stocks = ticker
    ? mockStocks.filter((s) => s.ticker === ticker)
    : mockStocks;

  for (const stock of stocks) {
    try {
      const analysis = await esgBaselineAgent.analyze(stock, { forceRefresh: true });
      const event = {
        type: "esg_update",
        ticker: stock.ticker,
        company: stock.company,
        timestamp: new Date().toISOString(),
        data: {
          baselineEsgScore: analysis.baselineEsgScore,
          realtimeEsgScore: analysis.realtimeEsgScore,
          velocityOfChange: analysis.velocityOfChange,
          providerDivergence: analysis.providerDivergence,
          crossReference: {
            msci: analysis.crossReference.msci,
            sp_global: analysis.crossReference.sp_global,
            sustainalytics: analysis.crossReference.sustainalytics,
          },
          selectedComparison: analysis.selectedComparison,
          comparisonProvider: analysis.comparisonProvider,
          calculationEdge: analysis.calculationEdge,
        },
      };
      esgStreamEmitter.emit("esg_update", event);
      for (const res of subscribers) {
        if (!res.writableEnded) {
          res.write(`data: ${JSON.stringify(event)}\n\n`);
        }
      }
    } catch (err) {
      const errorEvent = {
        type: "error",
        ticker: stock.ticker,
        message: err.message,
        timestamp: new Date().toISOString(),
      };
      for (const res of subscribers) {
        if (!res.writableEnded) {
          res.write(`data: ${JSON.stringify(errorEvent)}\n\n`);
        }
      }
    }
  }
}

export function subscribeESGStream(res, { ticker = null } = {}) {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });

  const welcome = {
    type: "connected",
    message: "ESG baseline stream active — SGX ESGenome 27 metrics + global cross-reference",
    sources: ["ESGenome (SGX & MAS)", "SGXFIRST", "MSCI", "S&P Global", "Sustainalytics"],
    ticker: ticker || "all",
    timestamp: new Date().toISOString(),
  };
  res.write(`data: ${JSON.stringify(welcome)}\n\n`);

  subscribers.add(res);

  if (subscribers.size === 1 && !streamInterval) {
    streamInterval = setInterval(() => emitESGUpdate(ticker), STREAM_INTERVAL_MS);
    emitESGUpdate(ticker);
  }

  res.on("close", () => {
    subscribers.delete(res);
    if (subscribers.size === 0 && streamInterval) {
      clearInterval(streamInterval);
      streamInterval = null;
    }
  });
}

export function getESGStreamEmitter() {
  return esgStreamEmitter;
}

export async function getESGMethodologies() {
  const { METHODOLOGIES } = await import("../data/esgMethodologies.js");
  const { CORE_ESG_METRICS, ESGENOME_SOURCES } = await import("../data/esgenomeCoreMetrics.js");
  return {
    sources: ESGENOME_SOURCES,
    coreMetricsCount: CORE_ESG_METRICS.length,
    coreMetrics: CORE_ESG_METRICS,
    methodologies: METHODOLOGIES,
  };
}

export async function getESGBaselineForTicker(ticker) {
  const stock = mockStocks.find(
    (s) => s.ticker.toLowerCase() === ticker.toLowerCase()
  );
  if (!stock) return null;
  return esgBaselineAgent.analyze(stock);
}

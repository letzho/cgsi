import { Router } from "express";
import multer from "multer";
import {
  analyzeAllStocks,
  analyzeStockByTicker,
  getAlphaBasket,
  getGlobalIndices,
  invalidateStockAnalysis,
} from "../agents/pipeline.js";
import { chatWithGuide, getGuideWelcome, getGuideQuickPrompts } from "../agents/GuideAgent.js";
import { getAIStatus } from "../services/llm.js";
import { getLiveIndices } from "../services/marketData.js";
import {
  subscribeESGStream,
  getESGMethodologies,
  getESGBaselineForTicker,
} from "../services/esgStream.js";
import { BASELINE_ESG_THRESHOLD, MOMENTUM_THRESHOLD } from "../data/stocks.js";
import {
  getComments,
  getForumSummary,
  addComment,
  previewSentiment,
  getForumStorageStatus,
} from "../services/forum.js";
import { getVeritaNewsBundle, subscribeVeritaNewsStream } from "../services/veritaNews.js";
import { analyzeReport } from "../agents/ReportAnalystAgent.js";
import { mockStocks } from "../data/stocks.js";

const router = Router();

const reportUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

function resolveReportContext({ ticker, companyName }) {
  const stock = ticker
    ? mockStocks.find((s) => s.ticker.toLowerCase() === ticker.toLowerCase())
    : null;
  return {
    ticker: stock?.ticker || ticker || null,
    companyName: companyName || stock?.company || null,
  };
}

router.get("/stocks", async (req, res) => {
  try {
    const forceRefresh = req.query.refresh === "true";
    const comparisonProvider = req.query.comparison || "msci";
    const stocks = await analyzeAllStocks({ forceRefresh, comparisonProvider });
    const liveNews = stocks.filter((s) => s.agents?.newsScout?.live).length;
    const livePrices = stocks.filter((s) => s.priceLive).length;
    const liveEsg = stocks.filter((s) => s.agents?.esgBaseline?.live).length;

    res.json({
      success: true,
      count: stocks.length,
      metadata: {
        baselineEsgThreshold: BASELINE_ESG_THRESHOLD,
        momentumThreshold: MOMENTUM_THRESHOLD,
        engine: "CGS ESG Momentum Engine 2.0",
        pipeline: [
          "ESGBaselineAgent",
          "NewsScoutAgent",
          "InnovationAnalystAgent",
          "CrowdSentimentAgent",
          "PortfolioOrchestratorAgent",
          "GenerativeAnalystAgent",
          "GuideAgent",
        ],
        dataSources: {
          esgBaseline: "SGX ESGenome 27 Core Metrics + SGXFIRST (cross-ref MSCI/S&P Global/Sustainalytics)",
          news: "Google News RSS (web search) + mock fallback",
          prices: "Yahoo Finance + mock fallback",
          baselineEsg: "SGX ESGenome 27-metric composite (replaces static mock)",
          forum: "Investor discussion forum with AI sentiment (Supabase PostgreSQL or in-memory)",
        },
        liveNewsCount: liveNews,
        livePriceCount: livePrices,
        liveEsgCount: liveEsg,
        forum: getForumStorageStatus(),
      },
      stocks,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/analyze", async (req, res) => {
  const { ticker, comparisonProvider = "msci" } = req.body;

  if (!ticker) {
    return res.status(400).json({
      success: false,
      error: "ticker is required in request body",
    });
  }

  try {
    const result = await analyzeStockByTicker(ticker, {
      forceRefresh: true,
      comparisonProvider,
    });

    if (!result) {
      return res.status(404).json({
        success: false,
        error: `Stock with ticker '${ticker}' not found`,
      });
    }

    res.json({
      success: true,
      stock: result,
      pipeline: {
        agentsExecuted: [
          "ESGBaselineAgent",
          "NewsScoutAgent",
          "InnovationAnalystAgent",
          "CrowdSentimentAgent",
          "PortfolioOrchestratorAgent",
        ],
        esgLive: result.agents?.esgBaseline?.live ?? false,
        newsLive: result.agents?.newsScout?.live ?? false,
        priceLive: result.priceLive ?? false,
        executedAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/alpha-basket", async (req, res) => {
  try {
    const basket = await getAlphaBasket();
    res.json({
      success: true,
      count: basket.length,
      quadrant: "Hidden Winners",
      description:
        "High-conviction ASEAN equities with low baseline ESG but accelerating momentum",
      stocks: basket,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/indices", async (_req, res) => {
  try {
    const payload = await getLiveIndices();
    res.json({
      success: true,
      indices: payload.indices,
      live: payload.live ?? false,
      updatedAt: payload.updatedAt || new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/ai/status", (_req, res) => {
  res.json({ success: true, ...getAIStatus() });
});

router.post("/guide/chat", async (req, res) => {
  const { message, context = {} } = req.body;

  if (!message || typeof message !== "string" || !message.trim()) {
    return res.status(400).json({
      success: false,
      error: "message is required in request body",
    });
  }

  try {
    const result = await chatWithGuide(message.trim(), context);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message || "Guide agent failed to respond",
    });
  }
});

router.get("/esg/methodologies", async (_req, res) => {
  try {
    const data = await getESGMethodologies();
    res.json({ success: true, ...data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/esg/baseline/:ticker", async (req, res) => {
  try {
    const result = await getESGBaselineForTicker(req.params.ticker);
    if (!result) {
      return res.status(404).json({
        success: false,
        error: `Stock with ticker '${req.params.ticker}' not found`,
      });
    }
    res.json({ success: true, analysis: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/esg/stream", (req, res) => {
  const ticker = req.query.ticker || null;
  subscribeESGStream(res, { ticker });
});

router.get("/verita-news", async (req, res) => {
  try {
    const forceRefresh = req.query.refresh === "true";
    const bundle = await getVeritaNewsBundle({ forceRefresh });
    res.json({ success: true, ...bundle });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/verita-news/stream", (req, res) => {
  subscribeVeritaNewsStream(res);
});

router.get("/forum/comments", async (req, res) => {
  try {
    const ticker = req.query.ticker || null;
    const comments = await getComments({ ticker });
    res.json({
      success: true,
      count: comments.length,
      ticker: ticker || "all",
      comments,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/forum/summary", async (_req, res) => {
  try {
    const summary = await getForumSummary();
    res.json({
      success: true,
      count: summary.length,
      summary,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/forum/comments", async (req, res) => {
  const { ticker, author, text } = req.body;

  if (!ticker) {
    return res.status(400).json({ success: false, error: "ticker is required" });
  }

  try {
    const comment = await addComment({ ticker, author, text });
    invalidateStockAnalysis(comment.ticker);
    res.status(201).json({ success: true, comment });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.post("/forum/analyze-preview", async (req, res) => {
  const { text, ticker } = req.body;

  if (!text || typeof text !== "string") {
    return res.status(400).json({ success: false, error: "text is required" });
  }

  try {
    const sentiment = await previewSentiment(text, ticker);
    res.json({ success: true, sentiment });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/reports/analyze-url", async (req, res) => {
  const { url, ticker, companyName } = req.body;

  if (!url || typeof url !== "string") {
    return res.status(400).json({ success: false, error: "url is required" });
  }

  try {
    const document = await extractFromUrl(url.trim());
    const context = resolveReportContext({ ticker, companyName });
    const analysis = await analyzeReport(document, context);

    res.json({
      success: true,
      analysis,
      extraction: {
        sourceType: document.sourceType,
        sourceLabel: document.sourceLabel,
        charCount: document.charCount,
      },
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.post("/reports/analyze-upload", reportUpload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: "file is required (PDF, TXT, or MD)" });
  }

  try {
    const document = await extractFromUpload(req.file);
    const context = resolveReportContext({
      ticker: req.body.ticker,
      companyName: req.body.companyName,
    });
    const analysis = await analyzeReport(document, context);

    res.json({
      success: true,
      analysis,
      extraction: {
        sourceType: document.sourceType,
        sourceLabel: document.sourceLabel,
        charCount: document.charCount,
      },
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.get("/reports/tickers", (_req, res) => {
  res.json({
    success: true,
    tickers: mockStocks.map((s) => ({
      ticker: s.ticker,
      company: s.company,
      sector: s.sector,
    })),
  });
});

router.get("/guide/welcome", async (req, res) => {
  try {
    const context = {
      page: req.query.page || "dashboard",
      selectedTicker: req.query.selectedTicker || null,
    };
    const basket = await getAlphaBasket();

    res.json({
      success: true,
      message: await getGuideWelcome({ ...context, hiddenWinnersCount: basket.length }),
      quickPrompts: getGuideQuickPrompts(),
      agent: "CGS GuideAgent",
      ai: getAIStatus(),
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;

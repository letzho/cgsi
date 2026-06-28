import { analyzeAllStocks, getAlphaBasket } from "./pipeline.js";
import { BASELINE_ESG_THRESHOLD, MOMENTUM_THRESHOLD, mockStocks } from "../data/stocks.js";
import { isAIEnabled, generateChat, getAIStatus } from "../services/llm.js";
import { buildGuideContext } from "../services/aiContext.js";

const QUICK_TOPICS = {
  matrix: "ESG Momentum Matrix",
  hidden: "Hidden Winners",
  agents: "Quad-Agent Pipeline",
  alpha: "Monday Morning Alpha Basket",
  games: "Game Arena & Points",
  screener: "Equity Screener",
  signals: "Action Signals",
};

async function findStock(ticker) {
  if (!ticker) return null;
  const stocks = await analyzeAllStocks();
  return stocks.find(
    (s) => s.ticker.toLowerCase() === ticker.toLowerCase()
  );
}

async function summarizeUniverse() {
  const stocks = await analyzeAllStocks();
  const byQuadrant = {};
  stocks.forEach((s) => {
    byQuadrant[s.quadrant] = (byQuadrant[s.quadrant] || 0) + 1;
  });
  return { stocks, byQuadrant, count: stocks.length };
}

export class GuideAgent {
  constructor() {
    this.name = "CGS GuideAgent";
    this.description =
      "Agentic generative AI guide — RAG over live quad-agent pipeline data (OpenAI when configured)";
  }

  async chat(message, context = {}) {
    const started = Date.now();

    if (isAIEnabled()) {
      try {
        const result = await this.generativeChat(message, context);
        return {
          ...result,
          latencyMs: Date.now() - started,
          processedAt: new Date().toISOString(),
        };
      } catch (err) {
        console.warn("[GuideAgent] Generative fallback:", err.message);
      }
    }

    return this.ruleBasedChat(message, context, started);
  }

  async generativeChat(message, context) {
    const ragContext = await buildGuideContext(context);

    const systemPrompt = `You are CGS GuideAgent — an agentic generative AI assistant embedded in the CGS ESG Momentum Engine 2.0 hackathon dashboard.

You have access to LIVE pipeline data via RAG context (not generic training knowledge). The system uses:
- ESGBaselineAgent: SGX ESGenome 27 Core Metrics (MAS/SGX) as clean baseline, cross-ref MSCI, S&P Global, Sustainalytics
- NewsScoutAgent: live Google News RSS sentiment
- InnovationAnalystAgent: digital & AI maturity
- PortfolioOrchestratorAgent: CGS Dynamic Momentum Score + 2×2 matrix quadrant
- GenerativeAnalystAgent: AI investment thesis (when enabled)

Rules:
- Answer using ONLY the RAG context JSON below plus the user's question
- Be concise: 2-4 short paragraphs, markdown bold for key terms
- If asked about a stock, use selectedStock data when available
- Mention SGX ESGenome vs global rater divergence when relevant
- For Hidden Winners: low baseline ESG + high momentum = alpha opportunity

RAG CONTEXT:
${JSON.stringify(ragContext, null, 2)}`;

    const { content, model } = await generateChat(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
      { maxTokens: 650, temperature: 0.35 }
    );

    const suggestions = this.buildSuggestions(message, ragContext);

    return {
      agent: this.name,
      message: content,
      suggestions,
      intent: "generative",
      aiPowered: true,
      model,
      mode: "agentic_rag",
    };
  }

  buildSuggestions(message, ctx) {
    const base = [
      "Explain the matrix",
      "What are Hidden Winners?",
      "How do the agents work?",
    ];
    if (ctx.selectedStock) {
      return [
        `Why ${ctx.selectedStock.actionSignal} on ${ctx.selectedStock.ticker}?`,
        "Explain ESG provider divergence",
        "Show alpha basket",
      ];
    }
    if (/hidden|alpha/i.test(message)) {
      return ["List current Hidden Winners", "Explain momentum score", "Explain agents"];
    }
    return base;
  }

  async ruleBasedChat(message, context, started) {
    const intent = this.detectIntent(message, context);
    let reply;
    let suggestions = [];

    switch (intent) {
      case "greeting":
        reply = await this.greeting(context);
        suggestions = ["Explain the matrix", "What are Hidden Winners?", "How do I earn points?"];
        break;
      case "stock":
        reply = await this.explainStock(context.selectedTicker || this.extractTicker(message));
        suggestions = ["Why this quadrant?", "Explain the agents", "Show alpha basket"];
        break;
      case "matrix":
        reply = await this.explainMatrix();
        suggestions = ["What are Hidden Winners?", "Explain a stock", "How to read signals"];
        break;
      case "hidden_winners":
        reply = await this.explainHiddenWinners();
        suggestions = ["Open alpha basket", "Explain matrix", "Pick a stock for me"];
        break;
      case "agents":
        reply = await this.explainAgents(context.selectedTicker);
        suggestions = ["Explain this stock", "What is momentum score?", "Hidden Winners"];
        break;
      case "alpha_basket":
        reply = await this.explainAlphaBasket();
        suggestions = ["List Hidden Winners", "Explain matrix", "How to export"];
        break;
      case "games":
        reply = this.explainGames();
        suggestions = ["How many points for a ticket?", "Explain dashboard", "What are Hidden Winners?"];
        break;
      case "screener":
        reply = this.explainScreener();
        suggestions = ["Explain action signals", "Filter Hidden Winners", "Explain matrix"];
        break;
      case "signals":
        reply = this.explainSignals();
        suggestions = ["What is Short signal?", "Hidden Winners", "Explain a stock"];
        break;
      case "momentum":
        reply = await this.explainMomentum(context.selectedTicker);
        suggestions = ["Explain agents", "Explain matrix", "Show Hidden Winners"];
        break;
      case "help":
        reply = this.generalHelp();
        suggestions = Object.values(QUICK_TOPICS).map((t) => `Explain ${t}`);
        break;
      default:
        reply = await this.smartFallback(message, context);
        suggestions = ["Explain the matrix", "What are Hidden Winners?", "Guide me on dashboard"];
    }

    return {
      agent: this.name,
      message: reply,
      suggestions: suggestions.slice(0, 4),
      intent,
      aiPowered: false,
      mode: "rule_based",
      latencyMs: Date.now() - started,
      processedAt: new Date().toISOString(),
    };
  }

  detectIntent(message, context) {
    const m = message.toLowerCase().trim();

    if (/^(hi|hello|hey|start|help me)/.test(m)) return "greeting";
    if (context.selectedTicker && /this stock|selected|current stock|explain it/.test(m))
      return "stock";
    if (/hidden winner|alpha target|mispriced/.test(m)) return "hidden_winners";
    if (/matrix|quadrant|scatter|2x2|2×2/.test(m)) return "matrix";
    if (/agent|pipeline|newsscout|innovation|orchestrator|generative/.test(m)) return "agents";
    if (/alpha basket|monday morning|buy.?list|export/.test(m)) return "alpha_basket";
    if (/game|point|ticket|reward|arena|gamif/.test(m)) return "games";
    if (/screener|table|search|filter/.test(m)) return "screener";
    if (/signal|buy|short|underweight|action/.test(m)) return "signals";
    if (/momentum|dynamic score|cgs score/.test(m)) return "momentum";
    if (this.extractTicker(message)) return "stock";
    if (/help|guide|how|what is|explain|tell me/.test(m)) return "help";
    return "fallback";
  }

  extractTicker(message) {
    const upper = message.toUpperCase();
    return mockStocks.find((s) => upper.includes(s.ticker.toUpperCase()))?.ticker || null;
  }

  async greeting(ctx) {
    const aiNote = isAIEnabled()
      ? " **Generative AI is active** — I use live LLM + pipeline RAG."
      : `\n\n⚠️ *Generative AI offline* — add \`OPENAI_API_KEY\` to backend/.env. Using rule-based mode.`;
    const { count } = await summarizeUniverse();
    const basket = await getAlphaBasket();
    return `Welcome to **CGS ESG Momentum Engine 2.0**! I'm your **GuideAgent** — agentic AI over live pipeline data.${aiNote}

Tracking **${count} ASEAN equities** · **${basket.length} Hidden Winners** flagged.${
      ctx.selectedTicker
        ? ` You have **${ctx.selectedTicker}** selected — ask me anything about it.`
        : " Click a stock, then ask me to explain it."
    }`;
  }

  async explainMatrix() {
    const { byQuadrant } = await summarizeUniverse();
    const lines = Object.entries(byQuadrant)
      .map(([q, n]) => `• **${q}**: ${n} stocks`)
      .join("\n");

    return `The **ESG Momentum Matrix** is a 2×2 scatter plot:

**X-axis** = Baseline ESG (SGX ESGenome + MSCI/S&P/Sustainalytics multi-baseline view)
**Y-axis** = Momentum rate of change (%)

Thresholds: ESG **${BASELINE_ESG_THRESHOLD}** · Momentum **${MOMENTUM_THRESHOLD}**

**Live universe:**
${lines}

**Hidden Winners** (low ESG + high momentum) → **Buy** — #1 alpha target`;
  }

  async explainHiddenWinners() {
    const basket = await getAlphaBasket();
    if (basket.length === 0) {
      return `**Hidden Winners**: baseline ESG below **${BASELINE_ESG_THRESHOLD}**, momentum above **${MOMENTUM_THRESHOLD}**. Market prices stale ESG; our agents detect velocity before raters re-rate. None in basket now — re-analyze to refresh.`;
    }
    const list = basket
      .map(
        (s) =>
          `• **${s.ticker}** — ESG ${s.baselineEsgScore} → Momentum ${s.cgsDynamicMomentumScore}`
      )
      .join("\n");
    return `**Hidden Winners** = mispriced ASEAN alpha:\n${list}\n\nUse **Monday Morning Alpha Basket** to export.`;
  }

  async explainStock(ticker) {
    const stock = await findStock(ticker);
    if (!stock) {
      return `Ticker **${ticker}** not found. Try: ${mockStocks.slice(0, 4).map((s) => s.ticker).join(", ")}`;
    }
    const gen = stock.agents?.generativeAnalyst;
    const thesis = gen?.aiPowered ? gen.thesis : stock.investmentThesis;

    return `**${stock.company}** (${stock.ticker}) · ${stock.sector}

• Baseline ESG: **${stock.baselineEsgScore}** · Momentum: **${stock.cgsDynamicMomentumScore}**
• Quadrant: **${stock.quadrant}** → **${stock.actionSignal}**
${gen?.aiPowered ? "• ✨ **AI-generated thesis**" : "• Template thesis (re-analyze with OPENAI_API_KEY for generative)"}

${thesis}`;
  }

  async explainAgents(ticker) {
    const stock = await findStock(ticker);
    const esgLine = stock?.agents?.esgBaseline
      ? `\n*${stock.ticker}:* SGX baseline **${stock.agents.esgBaseline.baselineEsgScore}**, MSCI ${stock.agents.esgBaseline.crossReference.msci.letterRating}, velocity **${stock.agents.esgBaseline.velocityOfChange.signal}**.`
      : "";

    return `**Quad-Agent + Generative AI Pipeline:**

**0. ESGBaselineAgent** — SGX ESGenome 27 metrics + MSCI/S&P/Sustainalytics cross-ref
**1. NewsScoutAgent** — Live news sentiment (Google News RSS)
**2. InnovationAnalystAgent** — Digital & AI maturity index
**3. PortfolioOrchestratorAgent** — CGS Dynamic Momentum Score + matrix quadrant
**4. GenerativeAnalystAgent** — 🧠 **Generative AI** investment thesis (OpenAI)${esgLine}

**GuideAgent (me)** — Agentic RAG chat over all pipeline outputs when OPENAI_API_KEY is set.`;
  }

  async explainAlphaBasket() {
    const basket = await getAlphaBasket();
    return `**Monday Morning Alpha Basket** — ${basket.length} Hidden Winners ready for export.${basket[0] ? ` Top: **${basket[0].ticker}**.` : ""}`;
  }

  explainGames() {
    return `**Game Arena**: ESG Quiz (20 pts), Matrix Matcher (30), Alpha Hunter (50). **500 pts** = talk ticket 🎫`;
  }

  explainScreener() {
    return `**Equity Screener** — filter by quadrant, search ticker/sector, click for deep dive + AI thesis.`;
  }

  explainSignals() {
    return `**Buy** = Hidden Winners + Future Leaders · **Short** = Value Traps · **Underweight** = Overrated Leaders`;
  }

  async explainMomentum(ticker) {
    const stock = await findStock(ticker);
    const ex = stock
      ? `\n**${stock.ticker}:** ${stock.baselineEsgScore} → **${stock.cgsDynamicMomentumScore}** (${stock.momentumRateOfChange > 0 ? "+" : ""}${stock.momentumRateOfChange}%)`
      : "";
    return `**CGS Dynamic Momentum Score** = 30% SGX baseline + 70% × (sentiment + AI maturity + velocity).${ex}`;
  }

  generalHelp() {
    const ai = getAIStatus();
    return `I'm **CGS GuideAgent**. ${ai.enabled ? "**Generative AI is ON.**" : "**Add OPENAI_API_KEY** to enable generative AI for hackathon compliance."}

Ask about matrix, Hidden Winners, any ticker, or agents.`;
  }

  async smartFallback(message, context) {
    const ticker = this.extractTicker(message) || context.selectedTicker;
    if (ticker) return await this.explainStock(ticker);
    return this.generalHelp();
  }
}

const guideAgent = new GuideAgent();

export async function chatWithGuide(message, context) {
  return guideAgent.chat(message, context);
}

export async function getGuideWelcome(context = {}) {
  const agent = new GuideAgent();
  return agent.greeting(context);
}

export function getGuideQuickPrompts() {
  return [
    { id: "matrix", label: "Explain the matrix", message: "Explain the ESG Momentum Matrix" },
    { id: "hidden", label: "Hidden Winners", message: "What are Hidden Winners and show me current picks?" },
    { id: "agents", label: "How agents + AI work", message: "Explain the agentic AI pipeline" },
    { id: "ai", label: "Generative AI thesis", message: "How does GenerativeAnalystAgent work?" },
  ];
}

export { getAIStatus };

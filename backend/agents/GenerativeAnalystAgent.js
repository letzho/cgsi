import { isAIEnabled, generateJSON } from "../services/llm.js";
import { buildGenerativeContext } from "../services/aiContext.js";
import { getCached, setCache } from "../services/cache.js";

const CACHE_TTL = 30 * 60 * 1000;

export class GenerativeAnalystAgent {
  constructor() {
    this.name = "GenerativeAnalystAgent";
    this.description =
      "Generative AI agent: produces institutional investment thesis and ESG divergence narrative from quad-agent pipeline outputs";
  }

  async analyze(stock, agentOutputs, { forceRefresh = false } = {}) {
    const cacheKey = `genai:${stock.ticker}`;

    if (!forceRefresh) {
      const cached = getCached(cacheKey);
      if (cached) return cached;
    }

    if (!isAIEnabled()) {
      return this.fallback(stock, agentOutputs);
    }

    try {
      const context = buildGenerativeContext(stock, agentOutputs);
      const result = await generateJSON(
        `You are GenerativeAnalystAgent in the CGS ESG Momentum Engine — an institutional ASEAN equity research AI.
You receive structured outputs from ESGBaselineAgent (SGX ESGenome 27 metrics), NewsScoutAgent, InnovationAnalystAgent, and PortfolioOrchestratorAgent.
Write for fund managers and hackathon judges. Reference SGX ESGenome as clean baseline vs MSCI/S&P/Sustainalytics divergence.
Be specific with numbers from the data. No hallucinated tickers or facts.`,
        `Generate analysis for this stock. Use ONLY the provided data:

${JSON.stringify(context, null, 2)}

Return JSON:
{
  "thesis": "2-3 sentence institutional investment thesis with specific scores",
  "esgInsight": "1-2 sentences on SGX vs global rater divergence and velocity of change",
  "actionRationale": "1 sentence justifying the action signal",
  "hackathonPitch": "1 sentence explaining the predictive edge for judges"
}`,
        { maxTokens: 500 }
      );

      const output = {
        agent: this.name,
        aiPowered: true,
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        thesis: result.thesis || agentOutputs.portfolioOrchestrator?.investmentThesis,
        esgInsight: result.esgInsight || "",
        actionRationale: result.actionRationale || "",
        hackathonPitch: result.hackathonPitch || "",
        source: "openai_generative",
        processedAt: new Date().toISOString(),
      };

      setCache(cacheKey, output, CACHE_TTL);
      return output;
    } catch (err) {
      const fallback = this.fallback(stock, agentOutputs);
      return {
        ...fallback,
        aiError: err.message,
      };
    }
  }

  fallback(stock, agentOutputs) {
    return {
      agent: this.name,
      aiPowered: false,
      thesis: agentOutputs.portfolioOrchestrator?.investmentThesis || "",
      esgInsight: agentOutputs.esgBaseline?.problemStatement?.slice(0, 200) || "",
      actionRationale: `${stock.actionSignal} signal from ${stock.quadrant} quadrant.`,
      hackathonPitch:
        "Enable OPENAI_API_KEY for generative thesis — SGX ESGenome baseline + velocity engine.",
      source: "template_fallback",
      processedAt: new Date().toISOString(),
    };
  }
}

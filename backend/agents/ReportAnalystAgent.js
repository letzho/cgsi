import { generateJSON, isAIEnabled, OPENAI_MODEL } from "../services/llm.js";

const ESG_KEYWORDS = {
  environmental: [
    "carbon", "emission", "climate", "renewable", "net zero", "sustainability",
    "green", "waste", "water", "biodiversity", "energy",
  ],
  social: [
    "diversity", "inclusion", "employee", "safety", "community", "human rights",
    "labour", "labor", "training", "health",
  ],
  governance: [
    "board", "governance", "ethics", "compliance", "audit", "risk", "transparency",
    "anti-corruption", "remuneration", "shareholder",
  ],
};

function countKeywordHits(text, words) {
  const lower = text.toLowerCase();
  return words.reduce((sum, w) => sum + (lower.includes(w) ? 1 : 0), 0);
}

function fallbackAnalysis(document, context = {}) {
  const text = document.text || "";
  const eHits = countKeywordHits(text, ESG_KEYWORDS.environmental);
  const sHits = countKeywordHits(text, ESG_KEYWORDS.social);
  const gHits = countKeywordHits(text, ESG_KEYWORDS.governance);
  const total = eHits + sHits + gHits;

  const pillarScore = (hits) => Math.min(85, 35 + hits * 8);
  const esgScore = Math.round((pillarScore(eHits) + pillarScore(sHits) + pillarScore(gHits)) / 3);

  const companyName = context.companyName || context.ticker || "Unknown Company";

  return {
    agent: "ReportAnalystAgent",
    companyName,
    ticker: context.ticker || null,
    reportType: "Financial / sustainability disclosure",
    esgScore,
    pillarScores: {
      environmental: pillarScore(eHits),
      social: pillarScore(sHits),
      governance: pillarScore(gHits),
    },
    environmental: {
      summary: `Environmental disclosure density: ${eHits} material keyword signals detected in uploaded document.`,
      highlights: eHits > 2 ? ["Climate and environmental themes referenced in report"] : [],
      risks: eHits < 2 ? ["Limited explicit environmental metrics in extracted text"] : [],
    },
    social: {
      summary: `Social pillar signals: ${sHits} workforce and community-related references found.`,
      highlights: sHits > 2 ? ["Employee and social responsibility themes present"] : [],
      risks: sHits < 2 ? ["Sparse social KPI disclosure in document extract"] : [],
    },
    governance: {
      summary: `Governance pillar signals: ${gHits} board, risk, and compliance references found.`,
      highlights: gHits > 2 ? ["Governance and risk oversight language identified"] : [],
      risks: gHits < 2 ? ["Governance detail may be insufficient for institutional ESG mandates"] : [],
    },
    findingsSummary: `Keyword scan of "${document.sourceLabel}" found ${total} ESG-related signal clusters across E/S/G pillars. Enable OpenAI for full generative analysis.`,
    keyFindings: [
      `Environmental signal strength: ${eHits} thematic hits`,
      `Social signal strength: ${sHits} thematic hits`,
      `Governance signal strength: ${gHits} thematic hits`,
      `Composite heuristic ESG score: ${esgScore}/100`,
    ],
    recommendation: esgScore >= 65 ? "Hold" : esgScore >= 50 ? "Underweight" : "Avoid",
    recommendationRationale:
      "Rule-based assessment from document keyword density — configure OPENAI_API_KEY for institutional-grade ESG report synthesis.",
    actionItems: [
      "Cross-reference findings with CGS Dynamic Momentum Score on Dashboard",
      "Compare against SGX ESGenome baseline for the same ticker",
      "Enable generative AI for full narrative summary and recommendation",
    ],
    dataGaps: ["Generative AI not configured — limited to keyword heuristics"],
    sourceType: document.sourceType,
    sourceLabel: document.sourceLabel,
    analyzedChars: document.text?.length || 0,
    aiPowered: false,
    processedAt: new Date().toISOString(),
  };
}

export async function analyzeReport(document, context = {}) {
  if (!document?.text?.trim()) {
    throw new Error("No document text to analyze");
  }

  if (!isAIEnabled()) {
    return fallbackAnalysis(document, context);
  }

  const companyHint = context.companyName || context.ticker || "infer from document";
  const prompt = `Analyze this financial / sustainability report extract for ESG (Environmental, Social, Governance) investment intelligence.

Company context: ${companyHint}${context.ticker ? ` (${context.ticker})` : ""}
Source: ${document.sourceLabel}
Extract length: ${document.text.length} characters

Return JSON with this exact structure:
{
  "companyName": string,
  "reportType": string,
  "esgScore": number 0-100,
  "pillarScores": { "environmental": number, "social": number, "governance": number },
  "environmental": { "summary": string, "highlights": string[], "risks": string[] },
  "social": { "summary": string, "highlights": string[], "risks": string[] },
  "governance": { "summary": string, "highlights": string[], "risks": string[] },
  "findingsSummary": string (2-3 sentences executive summary),
  "keyFindings": string[] (4-6 bullet points),
  "recommendation": "Buy" | "Hold" | "Underweight" | "Avoid",
  "recommendationRationale": string (2-3 sentences for institutional investors),
  "actionItems": string[] (3-5 actionable next steps),
  "dataGaps": string[] (disclosure gaps or missing metrics)
}

Focus on material ESG risks, greenwashing signals, transition plans, governance red flags, and whether momentum is improving ahead of ratings agencies.

DOCUMENT:
${document.text}`;

  try {
    const result = await generateJSON(
      "You are a senior ASEAN ESG equity research analyst at CGS International. Analyze corporate disclosures for investment decisions.",
      prompt,
      { maxTokens: 1400 }
    );

    return {
      agent: "ReportAnalystAgent",
      companyName: result.companyName || context.companyName || "Unknown Company",
      ticker: context.ticker || null,
      reportType: result.reportType || "Corporate report",
      esgScore: Math.max(0, Math.min(100, Number(result.esgScore) || 50)),
      pillarScores: {
        environmental: Number(result.pillarScores?.environmental) || 50,
        social: Number(result.pillarScores?.social) || 50,
        governance: Number(result.pillarScores?.governance) || 50,
      },
      environmental: result.environmental || { summary: "", highlights: [], risks: [] },
      social: result.social || { summary: "", highlights: [], risks: [] },
      governance: result.governance || { summary: "", highlights: [], risks: [] },
      findingsSummary: result.findingsSummary || "",
      keyFindings: Array.isArray(result.keyFindings) ? result.keyFindings : [],
      recommendation: ["Buy", "Hold", "Underweight", "Avoid"].includes(result.recommendation)
        ? result.recommendation
        : "Hold",
      recommendationRationale: result.recommendationRationale || "",
      actionItems: Array.isArray(result.actionItems) ? result.actionItems : [],
      dataGaps: Array.isArray(result.dataGaps) ? result.dataGaps : [],
      sourceType: document.sourceType,
      sourceLabel: document.sourceLabel,
      analyzedChars: document.text.length,
      aiPowered: true,
      model: OPENAI_MODEL,
      processedAt: new Date().toISOString(),
    };
  } catch {
    return fallbackAnalysis(document, context);
  }
}

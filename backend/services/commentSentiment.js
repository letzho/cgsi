import { generateJSON, isAIEnabled } from "./llm.js";

const POSITIVE_WORDS = [
  "upgrade", "upgraded", "beat", "beats", "surge", "growth", "green", "sustainable",
  "sustainability", "approval", "approved", "partnership", "inclusion", "record",
  "positive", "outperform", "renewable", "carbon neutral", "esg leader", "dividend",
  "expansion", "innovation", "milestone", "commitment", "net zero", "bullish", "strong",
  "leadership", "improving", "opportunity", "buy", "overweight",
];

const NEGATIVE_WORDS = [
  "fine", "fined", "investigation", "lawsuit", "allegation", "scandal", "downgrade",
  "downgraded", "violation", "breach", "delay", "delayed", "miss", "misses", "loss",
  "decline", "layoff", "layoffs", "fraud", "corruption", "deforestation", "pollution",
  "warning", "probe", "resign", "resignation", "strike", "recall", "bearish", "weak",
  "concern", "red flag", "short", "avoid", "vague", "slow",
];

function keywordSentiment(text) {
  const lower = text.toLowerCase();
  let pos = 0;
  let neg = 0;
  POSITIVE_WORDS.forEach((w) => {
    if (lower.includes(w)) pos += 1;
  });
  NEGATIVE_WORDS.forEach((w) => {
    if (lower.includes(w)) neg += 1;
  });

  let score = 0;
  if (pos > 0 || neg > 0) {
    score = Math.max(-1, Math.min(1, (pos - neg) / Math.max(pos + neg, 1)));
  }

  const label = score > 0.2 ? "Bullish" : score < -0.2 ? "Bearish" : "Neutral";
  return {
    score: Math.round(score * 100) / 100,
    label,
    topics: [],
    reason: "Keyword-based ESG sentiment analysis",
    confidence: pos + neg > 0 ? 0.65 : 0.4,
    method: "keyword",
  };
}

export async function analyzeComment(text, ticker) {
  const trimmed = (text || "").trim();
  if (!trimmed) {
    return {
      score: 0,
      label: "Neutral",
      topics: [],
      reason: "Empty comment",
      confidence: 1,
      method: "keyword",
    };
  }

  if (isAIEnabled()) {
    try {
      const result = await generateJSON(
        "You are an ESG investment sentiment analyst. Score investor forum comments for environmental, social, and governance implications.",
        `Analyze this investor comment about stock ${ticker}.
Return JSON: { "score": number from -1 to 1, "label": "Bullish"|"Bearish"|"Neutral", "topics": string[] (max 3 ESG themes), "reason": string (one sentence), "confidence": number 0-1 }
Comment: "${trimmed.replace(/"/g, "'")}"`,
        { maxTokens: 300 }
      );

      const score = Math.max(-1, Math.min(1, Number(result.score) || 0));
      const label =
        result.label === "Bullish" || result.label === "Bearish" || result.label === "Neutral"
          ? result.label
          : score > 0.2
            ? "Bullish"
            : score < -0.2
              ? "Bearish"
              : "Neutral";

      return {
        score: Math.round(score * 100) / 100,
        label,
        topics: Array.isArray(result.topics) ? result.topics.slice(0, 3) : [],
        reason: result.reason || "AI ESG sentiment analysis",
        confidence: Math.max(0, Math.min(1, Number(result.confidence) || 0.85)),
        method: "openai",
      };
    } catch {
      // fall through to keyword
    }
  }

  return keywordSentiment(trimmed);
}

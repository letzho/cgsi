/**
 * Central generative AI service — OpenAI-compatible Chat Completions API.
 * Set OPENAI_API_KEY in backend/.env to enable live generative AI.
 */

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || null;
export const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";

export function isAIEnabled() {
  return Boolean(OPENAI_API_KEY && OPENAI_API_KEY.length > 10);
}

export function getAIStatus() {
  return {
    enabled: isAIEnabled(),
    provider: isAIEnabled() ? "OpenAI" : null,
    model: isAIEnabled() ? OPENAI_MODEL : null,
    mode: isAIEnabled() ? "generative" : "rule_based_fallback",
    message: isAIEnabled()
      ? "Generative AI active — GuideAgent & GenerativeAnalystAgent use live LLM"
      : "Set OPENAI_API_KEY in backend/.env to enable generative AI (required for hackathon demo)",
    setupHint:
      "Create backend/.env with: OPENAI_API_KEY=sk-...  (Get a free key at platform.openai.com)",
  };
}

export async function generateChat(messages, { maxTokens = 600, temperature = 0.4 } = {}) {
  if (!isAIEnabled()) {
    throw new Error("AI_NOT_CONFIGURED");
  }

  const res = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages,
      max_tokens: maxTokens,
      temperature,
    }),
    signal: AbortSignal.timeout(45000),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => "");
    throw new Error(`LLM request failed (${res.status}): ${err.slice(0, 200)}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error("Empty LLM response");
  return {
    content,
    model: data.model || OPENAI_MODEL,
    usage: data.usage,
  };
}

export async function generateJSON(systemPrompt, userPrompt, { maxTokens = 800 } = {}) {
  const result = await generateChat(
    [
      {
        role: "system",
        content:
          systemPrompt +
          "\n\nRespond with valid JSON only — no markdown fences, no extra text.",
      },
      { role: "user", content: userPrompt },
    ],
    { maxTokens, temperature: 0.3 }
  );

  try {
    return JSON.parse(result.content.replace(/^```json?\s*|\s*```$/g, ""));
  } catch {
    const match = result.content.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error("Failed to parse LLM JSON response");
  }
}

import { mockStocks } from "../data/stocks.js";
import { analyzeComment } from "./commentSentiment.js";
import { isSupabaseEnabled, getSupabaseStatus } from "./supabase.js";
import {
  memoryGetComments,
  memoryAddComment,
  memoryMakeId,
  seedMemoryForum,
} from "./forumMemory.js";
import {
  supabaseGetComments,
  supabaseAddComment,
  supabaseSeedIfEmpty,
  supabaseMakeId,
} from "./forumSupabase.js";

seedMemoryForum();

export function getForumStorageStatus() {
  return getSupabaseStatus();
}

export async function initForumStorage() {
  if (!isSupabaseEnabled()) {
    return { mode: "memory", seeded: false };
  }

  try {
    const result = await supabaseSeedIfEmpty();
    return { mode: "supabase", ...result };
  } catch (err) {
    console.error("Supabase forum init failed — using in-memory fallback:", err.message);
    return { mode: "memory", error: err.message };
  }
}

export function buildForumSummary(comments) {
  const byTicker = {};

  mockStocks.forEach((s) => {
    byTicker[s.ticker] = {
      ticker: s.ticker,
      company: s.company,
      commentCount: 0,
      crowdSentiment: 0,
      label: "No Discussion",
      bullishPct: 0,
    };
  });

  comments.forEach((c) => {
    if (!byTicker[c.ticker]) {
      byTicker[c.ticker] = {
        ticker: c.ticker,
        company: c.ticker,
        commentCount: 0,
        crowdSentiment: 0,
        label: "No Discussion",
        bullishPct: 0,
      };
    }
    byTicker[c.ticker].commentCount += 1;
  });

  Object.values(byTicker).forEach((entry) => {
    const tickerComments = comments.filter((c) => c.ticker === entry.ticker);
    if (!tickerComments.length) return;

    const avg =
      tickerComments.reduce((sum, c) => sum + c.sentiment.score, 0) / tickerComments.length;
    const bullish = tickerComments.filter((c) => c.sentiment.label === "Bullish").length;

    entry.crowdSentiment = Math.round(avg * 100) / 100;
    entry.bullishPct = Math.round((bullish / tickerComments.length) * 100);
    entry.label =
      avg > 0.2 ? "Crowd Bullish" : avg < -0.2 ? "Crowd Bearish" : "Crowd Neutral";
  });

  return Object.values(byTicker).sort((a, b) => b.commentCount - a.commentCount);
}

async function fetchComments(opts) {
  if (isSupabaseEnabled()) {
    try {
      return await supabaseGetComments(opts);
    } catch (err) {
      console.error("Supabase forum read failed — memory fallback:", err.message);
    }
  }
  return memoryGetComments(opts);
}

export async function getComments(opts = {}) {
  return fetchComments(opts);
}

export async function getCommentsForTicker(ticker) {
  return fetchComments({ ticker });
}

export async function getForumSummary() {
  const comments = await fetchComments({ limit: 500 });
  return buildForumSummary(comments);
}

export async function addComment({ ticker, author, text }) {
  const stock = mockStocks.find((s) => s.ticker.toLowerCase() === ticker.toLowerCase());
  if (!stock) {
    throw new Error(`Unknown ticker '${ticker}'`);
  }

  const trimmed = (text || "").trim();
  if (!trimmed) {
    throw new Error("Comment text is required");
  }

  const displayAuthor = (author || "anonymous").trim().slice(0, 40) || "anonymous";
  const sentiment = await analyzeComment(trimmed, stock.ticker);

  const comment = {
    id: isSupabaseEnabled() ? supabaseMakeId() : memoryMakeId(),
    ticker: stock.ticker,
    company: stock.company,
    author: displayAuthor,
    text: trimmed,
    sentiment,
    createdAt: new Date().toISOString(),
  };

  if (isSupabaseEnabled()) {
    try {
      return await supabaseAddComment(comment);
    } catch (err) {
      console.error("Supabase forum write failed — memory fallback:", err.message);
    }
  }

  return memoryAddComment(comment);
}

export async function previewSentiment(text, ticker) {
  const stock = mockStocks.find((s) => s.ticker.toLowerCase() === (ticker || "").toLowerCase());
  const resolvedTicker = stock?.ticker || ticker || "UNKNOWN";
  return analyzeComment(text, resolvedTicker);
}

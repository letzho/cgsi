import { randomUUID } from "crypto";
import { getSupabaseClient } from "./supabase.js";
import { SEED_COMMENTS } from "./forumMemory.js";

function rowToComment(row) {
  return {
    id: row.id,
    ticker: row.ticker,
    author: row.author,
    text: row.text,
    sentiment: row.sentiment,
    createdAt: row.created_at,
  };
}

export async function supabaseGetComments({ ticker = null, limit = 100 } = {}) {
  const supabase = getSupabaseClient();
  let query = supabase
    .from("forum_comments")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (ticker) {
    query = query.eq("ticker", ticker);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Supabase read failed: ${error.message}`);
  return (data || []).map(rowToComment);
}

export async function supabaseAddComment(comment) {
  const supabase = getSupabaseClient();
  const row = {
    id: comment.id,
    ticker: comment.ticker,
    author: comment.author,
    text: comment.text,
    sentiment: comment.sentiment,
    created_at: comment.createdAt,
  };

  const { data, error } = await supabase.from("forum_comments").insert(row).select().single();
  if (error) throw new Error(`Supabase insert failed: ${error.message}`);
  return rowToComment(data);
}

export async function supabaseSeedIfEmpty() {
  const supabase = getSupabaseClient();
  const { count, error: countError } = await supabase
    .from("forum_comments")
    .select("*", { count: "exact", head: true });

  if (countError) throw new Error(`Supabase seed check failed: ${countError.message}`);
  if (count > 0) return { seeded: false, count };

  const now = Date.now();
  const rows = SEED_COMMENTS.map((item, i) => ({
    id: `cmt_${randomUUID().slice(0, 8)}`,
    ticker: item.ticker,
    author: item.author,
    text: item.text,
    sentiment: item.sentiment,
    created_at: new Date(now - (SEED_COMMENTS.length - i) * 3600000).toISOString(),
  }));

  const { error } = await supabase.from("forum_comments").insert(rows);
  if (error) throw new Error(`Supabase seed failed: ${error.message}`);
  return { seeded: true, count: rows.length };
}

export function supabaseMakeId() {
  return `cmt_${randomUUID().slice(0, 12)}`;
}

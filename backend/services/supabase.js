import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || null;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || null;

let client = null;

export function isSupabaseEnabled() {
  return Boolean(
    SUPABASE_URL &&
      SUPABASE_SERVICE_ROLE_KEY &&
      SUPABASE_URL.startsWith("http") &&
      SUPABASE_SERVICE_ROLE_KEY.length > 20
  );
}

export function getSupabaseClient() {
  if (!isSupabaseEnabled()) {
    throw new Error("SUPABASE_NOT_CONFIGURED");
  }

  if (!client) {
    client = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  return client;
}

export function getSupabaseStatus() {
  return {
    enabled: isSupabaseEnabled(),
    url: isSupabaseEnabled() ? SUPABASE_URL : null,
    mode: isSupabaseEnabled() ? "supabase_postgres" : "in_memory_fallback",
    message: isSupabaseEnabled()
      ? "Forum comments persisted in Supabase PostgreSQL"
      : "Set SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY for persistent forum (optional for local dev)",
  };
}

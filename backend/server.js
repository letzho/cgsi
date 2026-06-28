import "dotenv/config";
import express from "express";
import cors from "cors";
import apiRoutes from "./routes/api.js";
import { getAIStatus } from "./services/llm.js";
import { getSupabaseStatus } from "./services/supabase.js";
import { initForumStorage } from "./services/forum.js";

const app = express();
const PORT = process.env.PORT || 3001;

const allowedOrigins = [
  "http://localhost:6174",
  ...(process.env.FRONTEND_URL || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
];

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.length <= 1 || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS blocked for origin: ${origin}`));
      }
    },
  })
);
app.use(express.json());

app.get("/api/health", (_req, res) => {
  const ai = getAIStatus();
  const supabase = getSupabaseStatus();
  res.json({
    status: "operational",
    engine: "CGS ESG Momentum Engine 2.0",
    version: "2.0.0",
    ai,
    supabase,
    timestamp: new Date().toISOString(),
  });
});

app.use("/api", apiRoutes);

const server = app.listen(PORT, async () => {
  const ai = getAIStatus();
  const supabase = getSupabaseStatus();
  const forum = await initForumStorage();

  console.log(`CGS ESG Momentum Engine 2.0 API running on http://localhost:${PORT}`);
  console.log(
    ai.enabled
      ? `Generative AI: ON (${ai.model})`
      : "Generative AI: OFF — set OPENAI_API_KEY in backend/.env"
  );
  console.log(
    supabase.enabled
      ? `Forum storage: Supabase PostgreSQL${forum.seeded ? " (seeded demo comments)" : ""}`
      : "Forum storage: in-memory (set SUPABASE_URL for production persistence)"
  );
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`\nPort ${PORT} is already in use.`);
    console.error("Stop other backend terminals, then run: npm run kill-port && npm run dev\n");
    process.exit(1);
  }
  throw err;
});

function shutdown(signal) {
  console.log(`\n${signal} — closing server...`);
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 1500).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

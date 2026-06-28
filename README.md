# CGS ESG Momentum Engine 2.0

Institutional investor dashboard for discovering mispriced ASEAN public equities through a simulated Tri-Agent ESG momentum pipeline.

## Architecture

```
CGSI/
├── backend/          # Node.js/Express API + Tri-Agent pipeline
│   ├── agents/       # NewsScout, InnovationAnalyst, PortfolioOrchestrator
│   ├── data/         # Mock ASEAN stock universe
│   └── routes/       # REST API endpoints
└── frontend/         # React Vite institutional terminal UI
    └── src/
        ├── components/   # Modular .jsx + .css per folder
        ├── pages/
        ├── hooks/
        └── services/
```

## Quick Start

### 1. Backend (port 3001)

```bash
cd backend
npm install
npm run dev
```

### 2. Frontend (port 6174)

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:6174

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Engine health check |
| GET | `/api/stocks` | Full analyzed stock universe |
| POST | `/api/analyze` | Re-run agent pipeline for a ticker |
| GET | `/api/alpha-basket` | Hidden Winners buy-list |
| POST | `/api/guide/chat` | AI GuideAgent — instant contextual explanations |
| GET | `/api/guide/welcome` | Guide welcome message + quick prompts |

## Tri-Agent Pipeline

1. **NewsScoutAgent** — News Sentiment Multiplier (-1.0 to +1.0)
2. **InnovationAnalystAgent** — Digital & AI Maturity Index (0–100)
3. **PortfolioOrchestratorAgent** — CGS Dynamic Momentum Score + 2×2 Matrix quadrant
4. **GuideAgent** — Embedded AI guide for instant dashboard explanations (live data)

### Matrix Quadrants

| Quadrant | Signal |
|----------|--------|
| Hidden Winners | Buy |
| Future Leaders | Buy |
| Value Traps | Short |
| Overrated Leaders | Underweight |

## Live Data Layer (on top of mock ESG baseline)

| Source | What updates | Fallback |
|--------|----------------|----------|
| **Google News RSS** | NewsScoutAgent headlines + sentiment | Mock headlines |
| **Yahoo Finance** | Stock prices + ASEAN indices | Static mock |
| **Mock static** | Baseline ESG scores | — |

- News cached **10 min** · Prices/indices cached **5 min**
- `POST /api/analyze` force-refreshes news + price for one stock
- `GET /api/stocks?refresh=true` force-refreshes entire universe

## Gamification (Hackathon Feature)

Earn **CGS Points** by playing mini-games and redeem them for **investing talk admission tickets**:

| Game | Points |
|------|--------|
| ESG Speed Quiz | 20/correct (+50 perfect bonus) |
| Matrix Matcher | 30/match (45s blitz) |
| Alpha Hunter | 50/find (+25 streak) |
| Daily Login | 25 (+15 streak bonus) |

**Rewards Store:** 500 pts → ASEAN ESG Talk · 750 pts → Masterclass · 1000 pts → VIP

Navigate to **Game Arena** and **Rewards Store** in the sidebar.

## Tech Stack

- **Frontend:** React, Vite, Tailwind CSS v4, Recharts, Lucide Icons, React Router
- **Backend:** Node.js, Express, CORS

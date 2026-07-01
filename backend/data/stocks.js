export const BASELINE_ESG_THRESHOLD = 50;
export const MOMENTUM_THRESHOLD = 55;

export const mockStocks = [
  {
    ticker: "D05.SI",
    yahooTicker: "D05.SI",
    company: "DBS Group Holdings",
    sector: "Financials",
    country: "Singapore",
    baselineEsgScore: 72,
    marketCap: "S$95.2B",
  },
  {
    ticker: "Z74.SI",
    yahooTicker: "Z74.SI",
    company: "Singapore Telecommunications",
    sector: "Telecommunications",
    country: "Singapore",
    baselineEsgScore: 68,
    marketCap: "S$52.1B",
  },
  {
    ticker: "MBS.AX",
    yahooTicker: null,
    company: "Marina Bay Shippers",
    sector: "Industrials",
    country: "Singapore",
    baselineEsgScore: 38,
    marketCap: "S$4.8B",
  },
  {
    ticker: "AAT.SG",
    yahooTicker: null,
    company: "ASEAN Agri-Tech Holdings",
    sector: "Agriculture",
    country: "Malaysia",
    baselineEsgScore: 41,
    marketCap: "RM 12.3B",
  },
  {
    ticker: "C6L.SI",
    yahooTicker: "C6L.SI",
    company: "Singapore Airlines",
    sector: "Transportation",
    country: "Singapore",
    baselineEsgScore: 55,
    marketCap: "S$14.7B",
  },
  {
    ticker: "G13.SI",
    yahooTicker: "G13.SI",
    company: "Genting Singapore",
    sector: "Hospitality",
    country: "Singapore",
    baselineEsgScore: 34,
    marketCap: "S$8.4B",
  },
  {
    ticker: "SEMBCORP.SI",
    yahooTicker: "U96.SI",
    company: "Sembcorp Industries",
    sector: "Utilities",
    country: "Singapore",
    baselineEsgScore: 76,
    marketCap: "S$11.2B",
  },
  {
    ticker: "BABA",
    yahooTicker: "BABA",
    company: "Alibaba Group (ASEAN Ops)",
    sector: "Technology",
    country: "Regional",
    baselineEsgScore: 48,
    marketCap: "US$198B",
  },
  {
    ticker: "TLKM.JK",
    yahooTicker: "TLKM.JK",
    company: "Telkom Indonesia",
    sector: "Telecommunications",
    country: "Indonesia",
    baselineEsgScore: 52,
    marketCap: "IDR 385T",
  },
  {
    ticker: "CPALL.BK",
    yahooTicker: "CPALL.BK",
    company: "CP All Public",
    sector: "Consumer Staples",
    country: "Thailand",
    baselineEsgScore: 61,
    marketCap: "THB 890B",
  },
  {
    ticker: "GTCAP.PS",
    yahooTicker: "GTCAP.PS",
    company: "GT Capital Holdings",
    sector: "Conglomerate",
    country: "Philippines",
    baselineEsgScore: 44,
    marketCap: "PHP 520B",
  },
  {
    ticker: "VNM.VN",
    yahooTicker: "VNM.VN",
    company: "Vietnam Dairy Products",
    sector: "Consumer Staples",
    country: "Vietnam",
    baselineEsgScore: 58,
    marketCap: "VND 185T",
  },
  {
    ticker: "GENT.KL",
    yahooTicker: "GENT.KL",
    company: "Genting Malaysia",
    sector: "Hospitality",
    country: "Malaysia",
    baselineEsgScore: 35,
    marketCap: "RM 8.9B",
  },
  {
    ticker: "SCG.BK",
    yahooTicker: "SCG.BK",
    company: "SCG Packaging",
    sector: "Materials",
    country: "Thailand",
    baselineEsgScore: 63,
    marketCap: "THB 42B",
  },
  {
    ticker: "BPI.PS",
    yahooTicker: "BPI.PS",
    company: "Bank of the Philippine Islands",
    sector: "Financials",
    country: "Philippines",
    baselineEsgScore: 67,
    marketCap: "PHP 410B",
  },
  {
    ticker: "NVL.VN",
    yahooTicker: "NVL.VN",
    company: "Novaland Investment",
    sector: "Real Estate",
    country: "Vietnam",
    baselineEsgScore: 29,
    marketCap: "VND 28T",
  },
];

export function generateEsgTrajectory(baselineScore, momentumScore, months = 12) {
  const trajectory = [];
  const now = new Date();
  const startScore = baselineScore * 0.85 + (Math.random() * 5 - 2.5);
  const endScore = momentumScore;

  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setMonth(date.getMonth() - i);
    const progress = (months - 1 - i) / (months - 1);
    const noise = (Math.random() - 0.5) * 3;
    const score = startScore + (endScore - startScore) * progress + noise;
    trajectory.push({
      month: date.toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
      score: Math.round(Math.max(0, Math.min(100, score)) * 10) / 10,
    });
  }
  return trajectory;
}

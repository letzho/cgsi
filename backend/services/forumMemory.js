export const SEED_COMMENTS = [
  {
    ticker: "D05.SI",
    author: "investor_jane",
    text: "DBS expanding green finance faster than peers — bullish on ESG momentum ahead of next disclosure cycle.",
    sentiment: {
      score: 0.78,
      label: "Bullish",
      topics: ["green finance", "ESG leadership"],
      reason: "Positive view on green finance expansion vs peers",
      confidence: 0.9,
      method: "seed",
    },
  },
  {
    ticker: "Z74.SI",
    author: "telco_watcher",
    text: "Singtel's carbon targets look vague. Governance concerns after the data breach — staying cautious.",
    sentiment: {
      score: -0.62,
      label: "Bearish",
      topics: ["governance", "carbon targets"],
      reason: "Governance and disclosure concerns",
      confidence: 0.88,
      method: "seed",
    },
  },
  {
    ticker: "BN4.SI",
    author: "energy_alpha",
    text: "Keppel divesting fossil assets — transition story improving. Hidden winner candidate for ESG mandates.",
    sentiment: {
      score: 0.55,
      label: "Bullish",
      topics: ["energy transition", "divestment"],
      reason: "Asset divestment supports transition narrative",
      confidence: 0.85,
      method: "seed",
    },
  },
  {
    ticker: "U11.SI",
    author: "risk_analyst_sg",
    text: "UOB fine for AML lapses is a red flag for the governance pillar. Underweight until remediation is clear.",
    sentiment: {
      score: -0.71,
      label: "Bearish",
      topics: ["governance", "regulatory risk"],
      reason: "AML fine signals governance weakness",
      confidence: 0.92,
      method: "seed",
    },
  },
  {
    ticker: "C6L.SI",
    author: "aviation_esg",
    text: "Singapore Airlines SAF adoption is slow vs EU carriers. Neutral for now — watching Q3 sustainability report.",
    sentiment: {
      score: 0.05,
      label: "Neutral",
      topics: ["sustainable aviation fuel", "disclosure lag"],
      reason: "Mixed view — slow progress but monitoring",
      confidence: 0.75,
      method: "seed",
    },
  },
  {
    ticker: "AAT.SG",
    author: "agri_tech",
    text: "ASEAN Agri-Tech patent filings in precision agriculture are picking up. Early signal before MSCI catches it.",
    sentiment: {
      score: 0.68,
      label: "Bullish",
      topics: ["precision agriculture", "innovation"],
      reason: "Patent activity suggests early ESG momentum",
      confidence: 0.87,
      method: "seed",
    },
  },
  {
    ticker: "MBS.AX",
    author: "short_seller_asia",
    text: "Marina Bay Shippers emissions data still opaque. Short candidate — momentum fading on governance.",
    sentiment: {
      score: -0.58,
      label: "Bearish",
      topics: ["emissions disclosure", "governance"],
      reason: "Opacity and fading momentum",
      confidence: 0.84,
      method: "seed",
    },
  },
  {
    ticker: "D05.SI",
    author: "esg_pm",
    text: "Solid net-zero commitment from DBS but valuation is rich. Hold with positive ESG tilt.",
    sentiment: {
      score: 0.35,
      label: "Bullish",
      topics: ["net zero", "valuation"],
      reason: "Positive ESG but tempered by valuation",
      confidence: 0.8,
      method: "seed",
    },
  },
];

let nextId = 1;
const comments = [];

function makeId() {
  return `cmt_${String(nextId++).padStart(4, "0")}`;
}

export function seedMemoryForum() {
  if (comments.length > 0) return;
  const now = Date.now();
  SEED_COMMENTS.forEach((item, i) => {
    comments.push({
      id: makeId(),
      ticker: item.ticker,
      author: item.author,
      text: item.text,
      sentiment: item.sentiment,
      createdAt: new Date(now - (SEED_COMMENTS.length - i) * 3600000).toISOString(),
    });
  });
}

seedMemoryForum();

export function memoryGetComments({ ticker = null, limit = 100 } = {}) {
  let list = [...comments].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );
  if (ticker) {
    list = list.filter((c) => c.ticker.toLowerCase() === ticker.toLowerCase());
  }
  return list.slice(0, limit);
}

export function memoryAddComment(comment) {
  comments.unshift(comment);
  return comment;
}

export function memoryMakeId() {
  return makeId();
}

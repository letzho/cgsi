const PATENT_CATEGORIES = [
  "AI/ML Process Optimization",
  "Green Hydrogen Production",
  "Blockchain Supply Chain Traceability",
  "Carbon Capture & Storage",
  "Precision Agriculture IoT",
  "Digital Twin Infrastructure",
  "Renewable Energy Grid Management",
  "ESG Data Analytics Platform",
];

const JOB_ROLES = [
  "Chief Sustainability Officer",
  "Head of AI & Digital Transformation",
  "ESG Reporting Manager",
  "Green Finance Analyst",
  "Carbon Accounting Specialist",
  "Renewable Energy Engineer",
];

function seededRandom(seed) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export class InnovationAnalystAgent {
  constructor() {
    this.name = "InnovationAnalystAgent";
    this.description = "Scans job boards and patent filings for Digital & AI Maturity Index";
  }

  analyze(stock) {
    const seed = stock.ticker.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    const rand = seededRandom(seed * 1.7);

    let baseMaturity;
    if (stock.sector === "Technology" || stock.sector === "Agriculture") {
      baseMaturity = 55 + rand * 40;
    } else if (stock.sector === "Utilities" || stock.sector === "Financials") {
      baseMaturity = 45 + rand * 35;
    } else if (stock.sector === "Hospitality" || stock.sector === "Real Estate") {
      baseMaturity = 15 + rand * 30;
    } else {
      baseMaturity = 30 + rand * 45;
    }

    if (stock.baselineEsgScore < 40) {
      baseMaturity += 10 + rand * 20;
    }

    const digitalAiMaturityIndex = Math.round(Math.max(0, Math.min(100, baseMaturity)));

    const patentCount = Math.floor(2 + rand * 28);
    const jobPostings = Math.floor(1 + rand * 15);

    const patents = PATENT_CATEGORIES.sort(() => seededRandom(seed) - 0.5).slice(
      0,
      Math.min(4, Math.ceil(patentCount / 7))
    );

    const openRoles = JOB_ROLES.sort(() => seededRandom(seed + 1) - 0.5).slice(
      0,
      Math.min(3, Math.ceil(jobPostings / 5))
    );

    return {
      agent: this.name,
      digitalAiMaturityIndex,
      maturityLabel:
        digitalAiMaturityIndex >= 70
          ? "Advanced"
          : digitalAiMaturityIndex >= 45
            ? "Developing"
            : "Nascent",
      patentFilings: patentCount,
      recentPatents: patents,
      activeJobPostings: jobPostings,
      keyHiringRoles: openRoles,
      processedAt: new Date().toISOString(),
    };
  }
}

export class CrowdSentimentAgent {
  constructor() {
    this.name = "CrowdSentimentAgent";
    this.description =
      "Aggregates investor forum comments with AI sentiment into crowd conviction signal";
  }

  analyze(stock, comments) {
    const list = comments ?? [];

    if (!list.length) {
      return {
        agent: this.name,
        crowdSentiment: 0,
        commentCount: 0,
        bullishPct: 0,
        bearishPct: 0,
        label: "No Discussion",
        recentTopics: [],
        processedAt: new Date().toISOString(),
      };
    }

    const avg =
      list.reduce((sum, c) => sum + c.sentiment.score, 0) / list.length;
    const bullish = list.filter((c) => c.sentiment.label === "Bullish").length;
    const bearish = list.filter((c) => c.sentiment.label === "Bearish").length;

    const topicCounts = {};
    list.forEach((c) => {
      (c.sentiment.topics || []).forEach((t) => {
        topicCounts[t] = (topicCounts[t] || 0) + 1;
      });
    });
    const recentTopics = Object.entries(topicCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([topic]) => topic);

    const crowdSentiment = Math.round(avg * 100) / 100;

    return {
      agent: this.name,
      crowdSentiment,
      commentCount: list.length,
      bullishPct: Math.round((bullish / list.length) * 100),
      bearishPct: Math.round((bearish / list.length) * 100),
      label:
        crowdSentiment > 0.2
          ? "Crowd Bullish"
          : crowdSentiment < -0.2
            ? "Crowd Bearish"
            : "Crowd Neutral",
      recentTopics,
      processedAt: new Date().toISOString(),
    };
  }
}

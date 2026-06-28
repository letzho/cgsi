import {
  BASELINE_ESG_THRESHOLD,
  MOMENTUM_THRESHOLD,
  generateEsgTrajectory,
} from "../data/stocks.js";

export class PortfolioOrchestratorAgent {
  constructor() {
    this.name = "PortfolioOrchestratorAgent";
    this.description = "Aggregates agent outputs into CGS Dynamic Momentum Score and matrix quadrant";
  }

  computeDynamicMomentumScore(
    baselineEsg,
    newsSentiment,
    digitalMaturity,
    velocityBoost = 0,
    crowdSentiment = 0
  ) {
    const sentimentBoost = (newsSentiment + 1) * 15;
    const maturityBoost = digitalMaturity * 0.5;
    const crowdBoost = (crowdSentiment + 1) * 10;
    const intangibleAlpha = sentimentBoost + maturityBoost + velocityBoost + crowdBoost;

    const baselineWeight = baselineEsg * 0.3;
    const raw = baselineWeight + intangibleAlpha * 0.7;

    return Math.round(Math.max(0, Math.min(100, raw)) * 10) / 10;
  }

  computeMomentumRateOfChange(baselineEsg, dynamicScore) {
    const rate = ((dynamicScore - baselineEsg) / Math.max(baselineEsg, 1)) * 100;
    return Math.round(rate * 10) / 10;
  }

  categorizeQuadrant(baselineEsg, dynamicScore) {
    const isHighBaseline = baselineEsg >= BASELINE_ESG_THRESHOLD;
    const isHighMomentum = dynamicScore >= MOMENTUM_THRESHOLD;

    if (!isHighBaseline && isHighMomentum) {
      return {
        quadrant: "Hidden Winners",
        quadrantId: "hidden_winners",
        description: "Low legacy ESG rating with accelerating momentum — primary alpha target",
        color: "#22c55e",
      };
    }
    if (isHighBaseline && isHighMomentum) {
      return {
        quadrant: "Future Leaders",
        quadrantId: "future_leaders",
        description: "Strong ESG foundation with continued momentum upside",
        color: "#3b82f6",
      };
    }
    if (!isHighBaseline && !isHighMomentum) {
      return {
        quadrant: "Value Traps",
        quadrantId: "value_traps",
        description: "Weak ESG profile with deteriorating momentum — avoid/short candidate",
        color: "#ef4444",
      };
    }
    return {
      quadrant: "Overrated Leaders",
      quadrantId: "overrated_leaders",
      description: "High legacy rating but momentum fading — underweight signal",
      color: "#f59e0b",
    };
  }

  deriveActionSignal(quadrantId) {
    const signals = {
      hidden_winners: "Buy",
      future_leaders: "Buy",
      value_traps: "Short",
      overrated_leaders: "Underweight",
    };
    return signals[quadrantId] || "Hold";
  }

  deriveMomentumRating(momentumRate) {
    if (momentumRate >= 25) return "Strong Positive";
    if (momentumRate >= 10) return "Positive";
    if (momentumRate >= -5) return "Neutral";
    if (momentumRate >= -15) return "Negative";
    return "Strong Negative";
  }

  generateInvestmentThesis(
    stock,
    newsOutput,
    innovationOutput,
    dynamicScore,
    quadrant,
    esgBaselineOutput,
    crowdOutput = null
  ) {
    const sentimentPct = Math.abs(Math.round(newsOutput.newsSentimentMultiplier * 100));
    const patentSurge = innovationOutput.patentFilings > 15;
    const velocityNote = esgBaselineOutput
      ? ` SGX ESGenome 27-metric baseline (${esgBaselineOutput.baselineEsgScore}) cross-referenced against MSCI/LSEG/Sustainalytics shows ${esgBaselineOutput.velocityOfChange.signal} velocity (${esgBaselineOutput.providerDivergence.label}, ${esgBaselineOutput.providerDivergence.spread}pt spread).`
      : "";
    const crowdNote =
      crowdOutput && crowdOutput.commentCount > 0
        ? ` Investor forum sentiment is ${crowdOutput.label.toLowerCase()} (${crowdOutput.commentCount} comments, crowd score ${crowdOutput.crowdSentiment}).`
        : "";

    if (quadrant.quadrantId === "hidden_winners") {
      return `${stock.company}'s legacy ESG rating of ${stock.baselineEsgScore} is suppressed by lagging annual reports, but a ${patentSurge ? `${innovationOutput.patentFilings}-filing surge in green-tech patents` : `${innovationOutput.digitalAiMaturityIndex}/100 digital maturity score`} and ${newsOutput.sentimentLabel.toLowerCase()} real-time sentiment (${sentimentPct}% intensity) triggers a high-conviction momentum breakout to ${dynamicScore}.${velocityNote}${crowdNote} Institutional overweight recommended ahead of index rebalancing cycles.`;
    }
    if (quadrant.quadrantId === "future_leaders") {
      return `${stock.company} maintains a robust SGX ESGenome baseline of ${stock.baselineEsgScore} with a CGS Dynamic Momentum Score of ${dynamicScore}, supported by ${innovationOutput.digitalAiMaturityIndex}/100 digital & AI maturity and ${newsOutput.sentimentLabel.toLowerCase()} media flow.${velocityNote}${crowdNote} Sustained ESG leadership with incremental alpha upside warrants core portfolio allocation.`;
    }
    if (quadrant.quadrantId === "value_traps") {
      return `${stock.company} presents a structurally weak ESG profile (${stock.baselineEsgScore} SGX baseline) compounded by ${newsOutput.sentimentLabel.toLowerCase()} sentiment and limited innovation signals (${innovationOutput.digitalAiMaturityIndex}/100 maturity).${velocityNote}${crowdNote} Dynamic score of ${dynamicScore} confirms deteriorating momentum — flag for short/avoid in ASEAN ESG-tilted mandates.`;
    }
    return `${stock.company}'s elevated SGX ESGenome baseline of ${stock.baselineEsgScore} masks fading momentum (dynamic score: ${dynamicScore}), with ${newsOutput.sentimentLabel.toLowerCase()} news flow and modest digital transformation progress (${innovationOutput.digitalAiMaturityIndex}/100).${velocityNote}${crowdNote} Recommend underweight relative to sector peers pending catalyst confirmation.`;
  }

  orchestrate(stock, newsOutput, innovationOutput, esgBaselineOutput = null, crowdOutput = null) {
    const baselineEsg = esgBaselineOutput?.baselineEsgScore ?? stock.baselineEsgScore;
    const velocityBoost = esgBaselineOutput
      ? esgBaselineOutput.velocityOfChange.percentDelta * 0.05
      : 0;

    const crowdSentiment = crowdOutput?.crowdSentiment ?? 0;

    const dynamicMomentumScore = this.computeDynamicMomentumScore(
      baselineEsg,
      newsOutput.newsSentimentMultiplier,
      innovationOutput.digitalAiMaturityIndex,
      velocityBoost,
      crowdSentiment
    );

    const momentumRateOfChange = this.computeMomentumRateOfChange(
      baselineEsg,
      dynamicMomentumScore
    );

    const quadrant = this.categorizeQuadrant(
      baselineEsg,
      dynamicMomentumScore
    );

    const actionSignal = this.deriveActionSignal(quadrant.quadrantId);
    const momentumRating = this.deriveMomentumRating(momentumRateOfChange);
    const investmentThesis = this.generateInvestmentThesis(
      stock,
      newsOutput,
      innovationOutput,
      dynamicMomentumScore,
      quadrant,
      esgBaselineOutput,
      crowdOutput
    );

    const esgTrajectory = generateEsgTrajectory(
      baselineEsg,
      dynamicMomentumScore
    );

    return {
      agent: this.name,
      cgsDynamicMomentumScore: dynamicMomentumScore,
      momentumRateOfChange,
      momentumRating,
      quadrant: quadrant.quadrant,
      quadrantId: quadrant.quadrantId,
      quadrantDescription: quadrant.description,
      quadrantColor: quadrant.color,
      actionSignal,
      investmentThesis,
      esgTrajectory,
      agentBreakdown: {
        baselineEsgContribution: baselineEsg,
        baselineSource: esgBaselineOutput ? "SGX ESGenome 27 Metrics" : "Static mock",
        velocityBoost: velocityBoost,
        newsSentimentMultiplier: newsOutput.newsSentimentMultiplier,
        digitalAiMaturityIndex: innovationOutput.digitalAiMaturityIndex,
        crowdSentiment,
        crowdCommentCount: crowdOutput?.commentCount ?? 0,
      },
      processedAt: new Date().toISOString(),
    };
  }
}

import { ESG_COMPARISON_PROVIDERS } from './constants';

export const BASELINE_SERIES = [
  {
    id: 'sgx',
    name: 'SGX ESGenome',
    shortName: 'SGX',
    color: '#0ea5e9',
    description: '27 Core Metrics baseline (MAS/SGX)',
  },
  {
    id: 'msci',
    name: 'MSCI ESG Ratings',
    shortName: 'MSCI',
    color: '#7c3aed',
    description: 'AAA–CCC · GICS industry-relative',
  },
  {
    id: 'sp_global',
    name: 'S&P Global ESG Score',
    shortName: 'S&P',
    color: '#d97706',
    description: '0–100 · CSA + disclosures',
  },
  {
    id: 'sustainalytics',
    name: 'Morningstar Sustainalytics',
    shortName: 'Sustain.',
    color: '#059669',
    description: 'Unmanaged risk (shown as comparable 0–100)',
    lowerIsBetter: true,
  },
];

export function getComparableBaselineScore(stock, providerId) {
  const esg = stock.agents?.esgBaseline;
  if (!esg) return stock.baselineEsgScore ?? 0;

  if (providerId === 'sgx') return esg.baselineEsgScore;

  const ref = esg.crossReference?.[providerId];
  if (!ref) return esg.baselineEsgScore;

  if (providerId === 'sustainalytics') {
    return Math.round((100 - ref.riskScore) * 10) / 10;
  }
  return ref.score;
}

export function formatNativeBaseline(stock, providerId) {
  const esg = stock.agents?.esgBaseline;
  if (!esg) return `${stock.baselineEsgScore}`;

  if (providerId === 'sgx') return `${esg.baselineEsgScore}/100`;

  const ref = esg.crossReference?.[providerId];
  if (!ref) return '—';

  if (providerId === 'msci') return `${ref.letterRating} (${ref.score})`;
  if (providerId === 'sustainalytics') return `${ref.riskScore} risk · ${ref.category}`;
  return `${ref.score}/100`;
}

export function getBaselineSpread(stock, visibleIds = null) {
  const series = filterBaselineSeries(visibleIds);
  const scores = series.map((s) => getComparableBaselineScore(stock, s.id));
  if (scores.length === 0) return 0;
  const min = Math.min(...scores);
  const max = Math.max(...scores);
  return Math.round((max - min) * 10) / 10;
}

export function filterBaselineSeries(visibleIds) {
  if (!visibleIds || visibleIds.length === 0) return BASELINE_SERIES;
  return BASELINE_SERIES.filter((s) => visibleIds.includes(s.id));
}

export function buildMultiBaselineChartData(stock, visibleIds = null) {
  return filterBaselineSeries(visibleIds).map((series) => ({
    id: series.id,
    name: series.shortName,
    fullName: series.name,
    score: getComparableBaselineScore(stock, series.id),
    nativeLabel: formatNativeBaseline(stock, series.id),
    color: series.color,
    lowerIsBetter: series.lowerIsBetter ?? false,
  }));
}

export function expandStocksToMultiBaselinePoints(
  stocks,
  highlightProvider = null,
  visibleIds = null
) {
  const seriesList = filterBaselineSeries(visibleIds);
  const points = [];

  for (const stock of stocks) {
    for (const series of seriesList) {
      const isHighlighted =
        !highlightProvider || series.id === 'sgx' || series.id === highlightProvider;

      points.push({
        ...stock,
        providerId: series.id,
        providerName: series.name,
        providerShortName: series.shortName,
        providerColor: series.color,
        nativeLabel: formatNativeBaseline(stock, series.id),
        x: getComparableBaselineScore(stock, series.id),
        y: stock.momentumRateOfChange,
        z: series.id === 'sgx' ? 120 : isHighlighted ? 90 : 55,
        opacity: isHighlighted ? 1 : 0.45,
        spread: getBaselineSpread(stock, visibleIds),
      });
    }
  }

  return points;
}

export function findStockFromPoint(stocks, point) {
  if (!point?.ticker) return null;
  return stocks.find((s) => s.ticker === point.ticker) || point;
}

export function getComparisonMeta(providerId) {
  return ESG_COMPARISON_PROVIDERS.find((p) => p.id === providerId) || ESG_COMPARISON_PROVIDERS[0];
}

export function buildClientSelectedComparison(stock, providerId) {
  const esg = stock.agents?.esgBaseline;
  if (!esg?.crossReference?.[providerId]) return esg?.selectedComparison ?? null;

  const entry = esg.crossReference[providerId];
  const meta = getComparisonMeta(providerId);
  const sgxBaseline = esg.baselineEsgScore;

  let displayValue;
  if (providerId === 'msci') displayValue = `${entry.letterRating} (${entry.score})`;
  else if (providerId === 'sustainalytics') displayValue = `${entry.riskScore} risk · ${entry.category}`;
  else displayValue = `${entry.score}/100`;

  return {
    providerId,
    provider: meta.name,
    scale: meta.scale,
    description: meta.description,
    displayValue,
    entry,
    divergenceFromBaseline: entry.deltaFromSGX,
    lowerIsBetter: meta.lowerIsBetter ?? false,
  };
}

import { useStocks } from '../../hooks/useStocks';
import MatrixScatter from '../../components/MatrixScatter/MatrixScatter';
import StockDetailPanel from '../../components/StockDetailPanel/StockDetailPanel';
import BaselineMetricPicker from '../../components/BaselineMetricPicker/BaselineMetricPicker';
import { QUADRANT_COLORS } from '../../utils/constants';
import './MatrixAnalytics.css';

const QUADRANT_INFO = [
  {
    id: 'hidden_winners',
    name: 'Hidden Winners',
    desc: 'Low baseline ESG + high momentum. Primary alpha target.',
  },
  {
    id: 'future_leaders',
    name: 'Future Leaders',
    desc: 'High baseline ESG + high momentum. Sustained leadership.',
  },
  {
    id: 'value_traps',
    name: 'Value Traps',
    desc: 'Low baseline ESG + low momentum. Short/avoid.',
  },
  {
    id: 'overrated_leaders',
    name: 'Overrated Leaders',
    desc: 'High baseline ESG + low momentum. Underweight.',
  },
];

export default function MatrixAnalytics() {
  const {
    stocks,
    loading,
    error,
    selectedStock,
    selectStock,
    reanalyze,
    reanalyzing,
    comparisonProvider,
    setComparisonProvider,
    visibleMetrics,
    setVisibleMetrics,
  } = useStocks();

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>Loading matrix data...</div>;
  }

  if (error) {
    return <div style={{ textAlign: 'center', padding: '3rem', color: '#dc2626' }}>{error}</div>;
  }

  return (
    <div className="matrix-page">
      <div className="matrix-page__intro">
        <h2>ESG Momentum Matrix Analytics</h2>
        <p>
          The 2×2 matrix classifies ASEAN equities by baseline public ESG rating (X-axis) against
          the proprietary CGS Dynamic Momentum Score (Y-axis). Quadrant placement is driven by the
          Tri-Agent pipeline combining real-time news sentiment and digital innovation signals.
        </p>
      </div>

      <div className="matrix-page__quadrants">
        {QUADRANT_INFO.map((q) => {
          const count = stocks.filter((s) => s.quadrantId === q.id).length;
          return (
            <div
              key={q.id}
              className="matrix-page__quadrant"
              style={{ borderTopColor: QUADRANT_COLORS[q.id] }}
            >
              <div className="matrix-page__quadrant-name">{q.name}</div>
              <div className="matrix-page__quadrant-count" style={{ color: QUADRANT_COLORS[q.id] }}>
                {count}
              </div>
              <div className="matrix-page__quadrant-desc">{q.desc}</div>
            </div>
          );
        })}
      </div>

      <div className="matrix-page__picker">
        <BaselineMetricPicker
          visibleMetrics={visibleMetrics}
          onChange={setVisibleMetrics}
        />
      </div>

      <MatrixScatter
        stocks={stocks}
        onStockClick={selectStock}
        selectedTicker={selectedStock?.ticker}
        highlightProvider={comparisonProvider}
        visibleMetrics={visibleMetrics}
      />

      <StockDetailPanel
        stock={selectedStock}
        isOpen={!!selectedStock}
        onClose={() => selectStock(null)}
        onReanalyze={reanalyze}
        reanalyzing={reanalyzing}
        comparisonProvider={comparisonProvider}
        onComparisonChange={setComparisonProvider}
        visibleMetrics={visibleMetrics}
        onVisibleMetricsChange={setVisibleMetrics}
      />
    </div>
  );
}

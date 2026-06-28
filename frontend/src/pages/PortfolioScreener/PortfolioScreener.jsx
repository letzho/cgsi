import { useState } from 'react';
import { useStocks } from '../../hooks/useStocks';
import EquityScreener from '../../components/EquityScreener/EquityScreener';
import StockDetailPanel from '../../components/StockDetailPanel/StockDetailPanel';
import './PortfolioScreener.css';

const FILTERS = [
  { id: null, label: 'All Equities' },
  { id: 'hidden_winners', label: 'Hidden Winners' },
  { id: 'future_leaders', label: 'Future Leaders' },
  { id: 'value_traps', label: 'Value Traps' },
  { id: 'overrated_leaders', label: 'Overrated Leaders' },
];

export default function PortfolioScreener() {
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
  const [quadrantFilter, setQuadrantFilter] = useState(null);

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>Loading screener...</div>;
  }

  if (error) {
    return <div style={{ textAlign: 'center', padding: '3rem', color: '#dc2626' }}>{error}</div>;
  }

  return (
    <div className="screener-page">
      <div className="screener-page__filters">
        {FILTERS.map((f) => (
          <button
            key={f.label}
            className={`screener-page__filter-btn ${
              quadrantFilter === f.id ? 'screener-page__filter-btn--active' : ''
            }`}
            onClick={() => setQuadrantFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <EquityScreener
        stocks={stocks}
        onStockClick={selectStock}
        selectedTicker={selectedStock?.ticker}
        filterQuadrant={quadrantFilter}
        title="Portfolio Equity Screener"
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

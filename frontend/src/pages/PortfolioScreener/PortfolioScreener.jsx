import { useState, useMemo } from 'react';
import { useStocks } from '../../hooks/useStocks';
import { useFavorites } from '../../context/FavoritesContext';
import EquityScreener from '../../components/EquityScreener/EquityScreener';
import StockDetailPanel from '../../components/StockDetailPanel/StockDetailPanel';
import StockComparePanel from '../../components/StockComparePanel/StockComparePanel';
import FavoritesPanel from '../../components/FavoritesPanel/FavoritesPanel';
import './PortfolioScreener.css';

const FILTERS = [
  { id: null, label: 'All Equities' },
  { id: 'hidden_winners', label: 'Hidden Winners' },
  { id: 'future_leaders', label: 'Future Leaders' },
  { id: 'value_traps', label: 'Value Traps' },
  { id: 'overrated_leaders', label: 'Overrated Leaders' },
];

function pickDefaultCompare(stocks, tickerPrefer) {
  return stocks.find((s) => s.ticker === tickerPrefer)?.ticker || stocks[0]?.ticker || '';
}

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
  const { lists } = useFavorites();
  const [quadrantFilter, setQuadrantFilter] = useState(null);
  const [activeListId, setActiveListId] = useState(null);

  const defaultHigh = useMemo(
    () => pickDefaultCompare(stocks, 'SEMBCORP.SI') || pickDefaultCompare(stocks, 'U96.SI'),
    [stocks]
  );
  const defaultLow = useMemo(() => pickDefaultCompare(stocks, 'G13.SI'), [stocks]);

  const [compareA, setCompareA] = useState('');
  const [compareB, setCompareB] = useState('');

  const compareTickerA = compareA || defaultHigh;
  const compareTickerB = compareB || defaultLow;

  const activeList = lists.find((l) => l.id === activeListId);
  const favoriteTickerFilter = activeList?.tickers?.length ? activeList.tickers : null;

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>Loading screener...</div>;
  }

  if (error) {
    return <div style={{ textAlign: 'center', padding: '3rem', color: '#dc2626' }}>{error}</div>;
  }

  return (
    <div className="screener-page">
      <StockComparePanel
        stocks={stocks}
        tickerA={compareTickerA}
        tickerB={compareTickerB}
        onTickerAChange={setCompareA}
        onTickerBChange={setCompareB}
      />

      <FavoritesPanel
        stocks={stocks}
        activeListId={activeListId}
        onSelectList={setActiveListId}
        onClearListFilter={() => setActiveListId(null)}
      />

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
        {activeList && (
          <button
            className="screener-page__filter-btn screener-page__filter-btn--fav screener-page__filter-btn--active"
            onClick={() => setActiveListId(null)}
          >
            ★ {activeList.name} (clear)
          </button>
        )}
      </div>

      <EquityScreener
        stocks={stocks}
        onStockClick={selectStock}
        selectedTicker={selectedStock?.ticker}
        filterQuadrant={quadrantFilter}
        favoriteTickerFilter={favoriteTickerFilter}
        title="Portfolio Equity Screener"
        showFavorites
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

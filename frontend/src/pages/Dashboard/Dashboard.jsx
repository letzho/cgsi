import { useState } from 'react';
import { useStocks } from '../../hooks/useStocks';
import StatsCards from '../../components/StatsCards/StatsCards';
import HeroBanner from '../../components/HeroBanner/HeroBanner';
import AlphaBasketButton from '../../components/AlphaBasketButton/AlphaBasketButton';
import MatrixScatter from '../../components/MatrixScatter/MatrixScatter';
import EquityScreener from '../../components/EquityScreener/EquityScreener';
import StockDetailPanel from '../../components/StockDetailPanel/StockDetailPanel';
import ESGDataSourceBadge, { getESGBaselineLive } from '../../components/ESGDataSourceBadge/ESGDataSourceBadge';
import ESGComparisonSelector from '../../components/ESGComparisonSelector/ESGComparisonSelector';
import BaselineMetricPicker from '../../components/BaselineMetricPicker/BaselineMetricPicker';
import AIGuide from '../../components/AIGuide/AIGuide';
import './Dashboard.css';

export default function Dashboard() {
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
  const [alphaFilter, setAlphaFilter] = useState(false);

  if (loading) {
    return (
      <div className="dashboard__loading">
        <div className="dashboard__spinner" />
        <p>Fetching live news & market data via Tri-Agent Pipeline…</p>
        <p style={{ fontSize: '0.75rem', marginTop: '0.5rem', color: '#94a3b8' }}>
          First load may take 10–20s (web news search per stock)
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard__error">
        <p>Failed to load market data: {error}</p>
        <p style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>
          Ensure the backend server is running on port 3001
        </p>
      </div>
    );
  }

  const hiddenWinnersCount = stocks.filter((s) => s.quadrantId === 'hidden_winners').length;
  const liveNews = stocks.filter((s) => s.agents?.newsScout?.live).length;
  const livePrices = stocks.filter((s) => s.priceLive).length;
  const liveEsg = stocks.filter((s) => getESGBaselineLive(s.agents?.esgBaseline)).length;
  const esgLiveAny = liveEsg > 0;

  return (
    <div className="dashboard">
      <div className="dashboard__live-bar">
        <span className="dashboard__live-pill dashboard__live-pill--on">● Live pipeline</span>
        <span>{liveNews}/{stocks.length} web news feeds</span>
        <span>{livePrices}/{stocks.length} live prices (Yahoo Finance)</span>
        <span className="dashboard__live-esg">
          {esgLiveAny ? (
            <>{liveEsg}/{stocks.length} live ESGenome</>
          ) : (
            <ESGDataSourceBadge live={false} compact />
          )}
        </span>
        <span className="dashboard__live-hint">Indices refresh every 60s · Re-analyze refreshes news</span>
      </div>
      <div className="dashboard__comparison-bar">
        <BaselineMetricPicker
          visibleMetrics={visibleMetrics}
          onChange={setVisibleMetrics}
        />
        <ESGComparisonSelector
          value={comparisonProvider}
          onChange={setComparisonProvider}
          compact
        />
      </div>
      <HeroBanner hiddenWinners={hiddenWinnersCount} />
      <StatsCards stocks={stocks} />

      <AlphaBasketButton
        hiddenWinnersCount={hiddenWinnersCount}
        onFilter={() => setAlphaFilter((prev) => !prev)}
      />

      <div className="dashboard__grid">
        <MatrixScatter
          stocks={stocks}
          onStockClick={selectStock}
          selectedTicker={selectedStock?.ticker}
          highlightProvider={comparisonProvider}
          visibleMetrics={visibleMetrics}
        />
        <EquityScreener
          stocks={stocks}
          onStockClick={selectStock}
          selectedTicker={selectedStock?.ticker}
          filterQuadrant={alphaFilter ? 'hidden_winners' : null}
          title={alphaFilter ? 'Hidden Winners — Alpha Basket' : 'ASEAN Equity Screener'}
          showFavorites
        />
      </div>

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

      <AIGuide selectedTicker={selectedStock?.ticker} stocksCount={stocks.length} />
    </div>
  );
}

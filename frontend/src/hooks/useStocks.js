import { useState, useEffect, useCallback } from 'react';
import { fetchStocks, analyzeStock } from '../services/api';
import { getStoredComparisonProvider } from '../components/ESGComparisonSelector/ESGComparisonSelector';
import {
  getStoredVisibleMetrics,
  storeVisibleMetrics,
} from '../components/BaselineMetricPicker/BaselineMetricPicker';

let cachedStocks = null;

export function useStocks() {
  const [comparisonProvider, setComparisonProviderState] = useState(getStoredComparisonProvider);
  const [visibleMetrics, setVisibleMetricsState] = useState(getStoredVisibleMetrics);
  const [stocks, setStocks] = useState(cachedStocks || []);
  const [loading, setLoading] = useState(!cachedStocks);
  const [error, setError] = useState(null);
  const [selectedStock, setSelectedStock] = useState(null);
  const [reanalyzing, setReanalyzing] = useState(false);

  const loadStocks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchStocks(comparisonProvider);
      cachedStocks = data.stocks;
      setStocks(data.stocks);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [comparisonProvider]);

  useEffect(() => {
    if (!cachedStocks) {
      loadStocks();
    }
  }, [loadStocks]);

  const setComparisonProvider = useCallback((provider) => {
    try {
      localStorage.setItem('cgsi_esg_comparison_provider', provider);
    } catch {
      /* ignore */
    }
    setComparisonProviderState(provider);
  }, []);

  const setVisibleMetrics = useCallback((metrics) => {
    if (!metrics?.length) return;
    storeVisibleMetrics(metrics);
    setVisibleMetricsState(metrics);
  }, []);

  const selectStock = useCallback(
    (stock) => {
      if (!stock) {
        setSelectedStock(null);
        return;
      }
      const full = stocks.find((s) => s.ticker === stock.ticker) || stock;
      setSelectedStock(full);
    },
    [stocks]
  );

  const reanalyze = useCallback(
    async (ticker, provider = comparisonProvider) => {
      try {
        setReanalyzing(true);
        const data = await analyzeStock(ticker, provider);
        const updated = data.stock;

        setStocks((prev) => {
          const next = prev.map((s) => (s.ticker === ticker ? updated : s));
          cachedStocks = next;
          return next;
        });

        setSelectedStock(updated);
      } catch (err) {
        setError(err.message);
      } finally {
        setReanalyzing(false);
      }
    },
    [comparisonProvider]
  );

  return {
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
    refresh: loadStocks,
  };
}

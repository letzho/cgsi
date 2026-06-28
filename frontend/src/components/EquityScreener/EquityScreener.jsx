import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { ACTION_SIGNAL_STYLES } from '../../utils/constants';
import './EquityScreener.css';

export default function EquityScreener({
  stocks,
  onStockClick,
  selectedTicker,
  filterQuadrant = null,
  title = 'ASEAN Equity Screener',
}) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    let result = stocks;

    if (filterQuadrant) {
      result = result.filter((s) => s.quadrantId === filterQuadrant);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (s) =>
          s.ticker.toLowerCase().includes(q) ||
          s.company.toLowerCase().includes(q) ||
          s.sector?.toLowerCase().includes(q) ||
          s.country?.toLowerCase().includes(q)
      );
    }

    return result;
  }, [stocks, search, filterQuadrant]);

  return (
    <div className="equity-screener">
      <div className="equity-screener__header">
        <div className="equity-screener__title">{title}</div>
        <div className="equity-screener__search">
          <Search size={15} color="#94a3b8" />
          <input
            type="text"
            placeholder="Search ticker, company, sector..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="equity-screener__table-wrap">
        <table className="equity-screener__table">
          <thead>
            <tr>
              <th>Ticker</th>
              <th>Company</th>
              <th>Price</th>
              <th>ESG Score</th>
              <th>Momentum</th>
              <th>Quadrant</th>
              <th>Signal</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="equity-screener__empty">
                  No equities match your criteria
                </td>
              </tr>
            ) : (
              filtered.map((stock) => {
                const signalStyle = ACTION_SIGNAL_STYLES[stock.actionSignal] || ACTION_SIGNAL_STYLES.Hold;
                return (
                  <tr
                    key={stock.ticker}
                    className={`equity-screener__row ${
                      stock.ticker === selectedTicker ? 'equity-screener__row--selected' : ''
                    }`}
                    onClick={() => onStockClick?.(stock)}
                  >
                    <td className="equity-screener__ticker">{stock.ticker}</td>
                    <td className="equity-screener__company">{stock.company}</td>
                    <td className="equity-screener__price">
                      {stock.price != null ? (
                        <>
                          <div className="equity-screener__price-val">
                            {stock.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                            {stock.priceLive && <span className="equity-screener__live-dot" title="Live from Yahoo Finance" />}
                          </div>
                          {stock.priceChangePct != null && (
                            <div
                              className={`equity-screener__price-chg ${
                                stock.priceChangePct >= 0
                                  ? 'equity-screener__price-chg--up'
                                  : 'equity-screener__price-chg--down'
                              }`}
                            >
                              {stock.priceChangePct >= 0 ? '+' : ''}
                              {(stock.priceChangePct * 100).toFixed(2)}%
                            </div>
                          )}
                        </>
                      ) : (
                        <span className="equity-screener__price-na">—</span>
                      )}
                    </td>
                    <td className="equity-screener__score">{stock.baselineEsgScore}</td>
                    <td className="equity-screener__momentum">
                      <div>{stock.cgsDynamicMomentumScore}</div>
                      <div style={{ color: '#94a3b8', fontSize: '0.65rem' }}>
                        {stock.momentumRating}
                      </div>
                    </td>
                    <td style={{ fontSize: '0.75rem' }}>{stock.quadrant}</td>
                    <td>
                      <span
                        className="equity-screener__signal"
                        style={{
                          background: signalStyle.bg,
                          color: signalStyle.text,
                          borderColor: signalStyle.border,
                        }}
                      >
                        {stock.actionSignal}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

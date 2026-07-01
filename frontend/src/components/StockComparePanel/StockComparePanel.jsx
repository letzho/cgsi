import { useMemo } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { TrendingUp, TrendingDown, Leaf } from 'lucide-react';
import { BASELINE_ESG_THRESHOLD } from '../../utils/constants';
import './StockComparePanel.css';

const COLORS = ['#00C076', '#FF4747'];

function mergeMomentumTrajectories(stockA, stockB) {
  const trajA = stockA?.esgTrajectory || [];
  const trajB = stockB?.esgTrajectory || [];
  return trajA.map((p, i) => ({
    month: p.month,
    [stockA.ticker]: trajA[i]?.score ?? null,
    [stockB.ticker]: trajB[i]?.score ?? null,
  }));
}

function mergeEsgTrajectories(stockA, stockB) {
  const trajA = stockA?.esgTrajectory || [];
  const trajB = stockB?.esgTrajectory || [];
  const baseA = stockA?.baselineEsgScore ?? 50;
  const baseB = stockB?.baselineEsgScore ?? 50;
  const realtimeA = stockA?.agents?.esgBaseline?.realtimeEsgScore ?? baseA;
  const realtimeB = stockB?.agents?.esgBaseline?.realtimeEsgScore ?? baseB;

  return trajA.map((p, i) => {
    const t = trajA.length > 1 ? i / (trajA.length - 1) : 1;
    return {
      month: p.month,
      [stockA.ticker]: Math.round((baseA + (realtimeA - baseA) * t) * 10) / 10,
      [stockB.ticker]: Math.round((baseB + (realtimeB - baseB) * t) * 10) / 10,
    };
  });
}

function buildEsgBarData(stockA, stockB) {
  if (!stockA || !stockB) return [];
  return [
    {
      metric: 'Baseline ESG',
      [stockA.ticker]: stockA.baselineEsgScore,
      [stockB.ticker]: stockB.baselineEsgScore,
    },
    {
      metric: 'Realtime ESG',
      [stockA.ticker]: stockA.agents?.esgBaseline?.realtimeEsgScore ?? stockA.baselineEsgScore,
      [stockB.ticker]: stockB.agents?.esgBaseline?.realtimeEsgScore ?? stockB.baselineEsgScore,
    },
    {
      metric: 'Dynamic Momentum',
      [stockA.ticker]: stockA.cgsDynamicMomentumScore,
      [stockB.ticker]: stockB.cgsDynamicMomentumScore,
    },
  ];
}

export default function StockComparePanel({ stocks, tickerA, tickerB, onTickerAChange, onTickerBChange }) {
  const stockA = stocks.find((s) => s.ticker === tickerA);
  const stockB = stocks.find((s) => s.ticker === tickerB);

  const momentumData = useMemo(() => {
    if (!stockA || !stockB) return [];
    return mergeMomentumTrajectories(stockA, stockB);
  }, [stockA, stockB]);

  const esgTrendData = useMemo(() => {
    if (!stockA || !stockB) return [];
    return mergeEsgTrajectories(stockA, stockB);
  }, [stockA, stockB]);

  const esgBarData = useMemo(() => buildEsgBarData(stockA, stockB), [stockA, stockB]);

  const sortedByMomentum = [...stocks].sort(
    (a, b) => (b.cgsDynamicMomentumScore || 0) - (a.cgsDynamicMomentumScore || 0)
  );

  return (
    <div className="stock-compare-panel">
      <div className="stock-compare-panel__header">
        <h3>Stock Comparison</h3>
        <p>Side-by-side momentum vs ESG score — default Sembcorp vs Genting Singapore</p>
      </div>

      <div className="stock-compare-panel__selectors">
        <label className="stock-compare-panel__select stock-compare-panel__select--high">
          <TrendingUp size={14} />
          <span>Stock A (high)</span>
          <select value={tickerA} onChange={(e) => onTickerAChange(e.target.value)}>
            {sortedByMomentum.map((s) => (
              <option key={s.ticker} value={s.ticker}>
                {s.ticker} — {s.company} (Mom {s.cgsDynamicMomentumScore})
              </option>
            ))}
          </select>
        </label>
        <label className="stock-compare-panel__select stock-compare-panel__select--low">
          <TrendingDown size={14} />
          <span>Stock B (low)</span>
          <select value={tickerB} onChange={(e) => onTickerBChange(e.target.value)}>
            {[...sortedByMomentum].reverse().map((s) => (
              <option key={s.ticker} value={s.ticker}>
                {s.ticker} — {s.company} (Mom {s.cgsDynamicMomentumScore})
              </option>
            ))}
          </select>
        </label>
      </div>

      {stockA && stockB && (
        <div className="stock-compare-panel__stats">
          <div className="stock-compare-panel__stat" style={{ borderColor: COLORS[0] }}>
            <strong>{stockA.ticker}</strong>
            <span>ESG {stockA.baselineEsgScore} · Mom {stockA.cgsDynamicMomentumScore}</span>
            <span className="stock-compare-panel__rate">
              {stockA.momentumRateOfChange > 0 ? '+' : ''}
              {stockA.momentumRateOfChange}% Δ
            </span>
          </div>
          <div className="stock-compare-panel__vs">vs</div>
          <div className="stock-compare-panel__stat" style={{ borderColor: COLORS[1] }}>
            <strong>{stockB.ticker}</strong>
            <span>ESG {stockB.baselineEsgScore} · Mom {stockB.cgsDynamicMomentumScore}</span>
            <span className="stock-compare-panel__rate">
              {stockB.momentumRateOfChange > 0 ? '+' : ''}
              {stockB.momentumRateOfChange}% Δ
            </span>
          </div>
        </div>
      )}

      <div className="stock-compare-panel__grid">
        <div className="stock-compare-panel__card">
          <div className="stock-compare-panel__card-title">
            <TrendingUp size={16} />
            Dynamic Momentum Trend
          </div>
          <p className="stock-compare-panel__card-sub">
            CGS Dynamic Momentum Score path (12-month)
          </p>
          <div className="stock-compare-panel__chart">
            {momentumData.length > 0 && stockA && stockB ? (
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={momentumData} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} stroke="#94a3b8" />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <ReferenceLine y={55} stroke="#94a3b8" strokeDasharray="4 4" label={{ value: 'Mom 55', fontSize: 9 }} />
                  <Line
                    type="monotone"
                    dataKey={stockA.ticker}
                    name={`${stockA.ticker} (${stockA.cgsDynamicMomentumScore})`}
                    stroke={COLORS[0]}
                    strokeWidth={2.5}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey={stockB.ticker}
                    name={`${stockB.ticker} (${stockB.cgsDynamicMomentumScore})`}
                    stroke={COLORS[1]}
                    strokeWidth={2.5}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="stock-compare-panel__empty">Select two stocks</div>
            )}
          </div>
        </div>

        <div className="stock-compare-panel__card">
          <div className="stock-compare-panel__card-title">
            <Leaf size={16} />
            ESG Score Comparison
          </div>
          <p className="stock-compare-panel__card-sub">
            SGX ESGenome baseline → realtime ESG trend + score snapshot
          </p>
          <div className="stock-compare-panel__chart stock-compare-panel__chart--split">
            {esgTrendData.length > 0 && stockA && stockB ? (
              <>
                <ResponsiveContainer width="100%" height={140}>
                  <LineChart data={esgTrendData} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 9 }} stroke="#94a3b8" hide />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 9 }} stroke="#94a3b8" width={28} />
                    <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                    <ReferenceLine y={BASELINE_ESG_THRESHOLD} stroke="#94a3b8" strokeDasharray="4 4" />
                    <Line
                      type="monotone"
                      dataKey={stockA.ticker}
                      stroke={COLORS[0]}
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey={stockB.ticker}
                      stroke={COLORS[1]}
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
                <ResponsiveContainer width="100%" height={100}>
                  <BarChart data={esgBarData} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="metric" tick={{ fontSize: 9 }} stroke="#94a3b8" />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 9 }} stroke="#94a3b8" width={28} />
                    <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    <Bar dataKey={stockA.ticker} fill={COLORS[0]} radius={[4, 4, 0, 0]} />
                    <Bar dataKey={stockB.ticker} fill={COLORS[1]} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </>
            ) : (
              <div className="stock-compare-panel__empty">Select two stocks</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

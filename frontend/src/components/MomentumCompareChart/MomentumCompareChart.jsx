import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';
import './MomentumCompareChart.css';

const COLORS = ['#00C076', '#FF4747', '#2563eb', '#FF6900'];

function mergeTrajectories(stockA, stockB) {
  const trajA = stockA?.esgTrajectory || [];
  const trajB = stockB?.esgTrajectory || [];
  const months = trajA.map((p) => p.month);

  return months.map((month, i) => ({
    month,
    [stockA.ticker]: trajA[i]?.score ?? null,
    [stockB.ticker]: trajB[i]?.score ?? null,
  }));
}

export default function MomentumCompareChart({ stocks, tickerA, tickerB, onTickerAChange, onTickerBChange }) {
  const stockA = stocks.find((s) => s.ticker === tickerA);
  const stockB = stocks.find((s) => s.ticker === tickerB);

  const chartData = useMemo(() => {
    if (!stockA || !stockB) return [];
    return mergeTrajectories(stockA, stockB);
  }, [stockA, stockB]);

  const sorted = [...stocks].sort(
    (a, b) => (b.cgsDynamicMomentumScore || 0) - (a.cgsDynamicMomentumScore || 0)
  );

  return (
    <div className="momentum-compare">
      <div className="momentum-compare__header">
        <h3>Momentum Rate Comparison</h3>
        <p>Compare high vs low CGS Dynamic Momentum — live prices via Yahoo Finance</p>
      </div>

      <div className="momentum-compare__selectors">
        <label className="momentum-compare__select momentum-compare__select--high">
          <TrendingUp size={14} />
          <span>High momentum</span>
          <select value={tickerA} onChange={(e) => onTickerAChange(e.target.value)}>
            {sorted.map((s) => (
              <option key={s.ticker} value={s.ticker}>
                {s.ticker} — {s.company} ({s.cgsDynamicMomentumScore})
              </option>
            ))}
          </select>
        </label>
        <label className="momentum-compare__select momentum-compare__select--low">
          <TrendingDown size={14} />
          <span>Low momentum</span>
          <select value={tickerB} onChange={(e) => onTickerBChange(e.target.value)}>
            {[...sorted].reverse().map((s) => (
              <option key={s.ticker} value={s.ticker}>
                {s.ticker} — {s.company} ({s.cgsDynamicMomentumScore})
              </option>
            ))}
          </select>
        </label>
      </div>

      {stockA && stockB && (
        <div className="momentum-compare__stats">
          <div className="momentum-compare__stat" style={{ borderColor: COLORS[0] }}>
            <strong>{stockA.ticker}</strong>
            <span>Momentum {stockA.cgsDynamicMomentumScore}</span>
            <span className="momentum-compare__rate">{stockA.momentumRateOfChange}% Δ</span>
            {stockA.priceLive && <span className="momentum-compare__live">Yahoo live</span>}
          </div>
          <div className="momentum-compare__vs">vs</div>
          <div className="momentum-compare__stat" style={{ borderColor: COLORS[1] }}>
            <strong>{stockB.ticker}</strong>
            <span>Momentum {stockB.cgsDynamicMomentumScore}</span>
            <span className="momentum-compare__rate">{stockB.momentumRateOfChange}% Δ</span>
            {stockB.priceLive && <span className="momentum-compare__live">Yahoo live</span>}
          </div>
        </div>
      )}

      <div className="momentum-compare__chart">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey={stockA.ticker}
                name={`${stockA.company} (${stockA.cgsDynamicMomentumScore})`}
                stroke={COLORS[0]}
                strokeWidth={2.5}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey={stockB.ticker}
                name={`${stockB.company} (${stockB.cgsDynamicMomentumScore})`}
                stroke={COLORS[1]}
                strokeWidth={2.5}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="momentum-compare__empty">Select two stocks to compare</div>
        )}
      </div>
    </div>
  );
}

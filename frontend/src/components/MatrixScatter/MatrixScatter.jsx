import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ZAxis,
} from 'recharts';
import {
  BASELINE_ESG_THRESHOLD,
  MOMENTUM_RATE_THRESHOLD,
  QUADRANT_COLORS,
} from '../../utils/constants';
import {
  BASELINE_SERIES,
  expandStocksToMultiBaselinePoints,
  findStockFromPoint,
  filterBaselineSeries,
} from '../../utils/esgComparison';
import './MatrixScatter.css';

const QUADRANT_LABELS = [
  { label: 'Hidden Winners', color: QUADRANT_COLORS.hidden_winners },
  { label: 'Future Leaders', color: QUADRANT_COLORS.future_leaders },
  { label: 'Value Traps', color: QUADRANT_COLORS.value_traps },
  { label: 'Overrated Leaders', color: QUADRANT_COLORS.overrated_leaders },
];

function MultiBaselineTooltip({ active, payload, stocks, visibleMetrics }) {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;
  const stock = findStockFromPoint(stocks, data);
  const sameCompany = expandStocksToMultiBaselinePoints([stock], null, visibleMetrics).filter(
    (p) => p.ticker === data.ticker
  );

  return (
    <div className="matrix-scatter__tooltip matrix-scatter__tooltip--multi">
      <div className="matrix-scatter__tooltip-title">{data.company}</div>
      <div className="matrix-scatter__tooltip-row">Ticker: {data.ticker}</div>
      <div className="matrix-scatter__tooltip-row">
        Momentum: {data.momentumRateOfChange > 0 ? '+' : ''}
        {data.momentumRateOfChange}%
      </div>
      <div className="matrix-scatter__tooltip-row">Quadrant: {data.quadrant}</div>
      <div className="matrix-scatter__tooltip-divider" />
      <div className="matrix-scatter__tooltip-section">All baselines (X-axis)</div>
      {sameCompany.map((p) => (
        <div key={p.providerId} className="matrix-scatter__tooltip-baseline">
          <span className="matrix-scatter__tooltip-dot" style={{ background: p.providerColor }} />
          <span>{p.providerShortName}: {p.nativeLabel}</span>
          <span className="matrix-scatter__tooltip-x">({p.x})</span>
        </div>
      ))}
      <div className="matrix-scatter__tooltip-row matrix-scatter__tooltip-spread">
        Spread: {data.spread} pts
      </div>
    </div>
  );
}

export default function MatrixScatter({
  stocks,
  onStockClick,
  selectedTicker,
  highlightProvider = null,
  visibleMetrics = null,
}) {
  const activeSeries = filterBaselineSeries(visibleMetrics);
  const allPoints = expandStocksToMultiBaselinePoints(stocks, highlightProvider, visibleMetrics);
  const metricCount = activeSeries.length;

  const handleClick = (point) => {
    const stock = findStockFromPoint(stocks, point);
    if (stock) onStockClick?.(stock);
  };

  return (
    <div className="matrix-scatter">
      <div className="matrix-scatter__header">
        <div>
          <div className="matrix-scatter__title">ESG Momentum Matrix · Multi-Baseline</div>
          <div className="matrix-scatter__subtitle">
            {metricCount === 1
              ? '1 baseline metric on X-axis · momentum on Y'
              : `${metricCount} baseline metrics per company on X · same momentum on Y`}
          </div>
        </div>
        <div className="matrix-scatter__legends">
          <div className="matrix-scatter__legend matrix-scatter__legend--baseline">
            {activeSeries.map((s) => (
              <div key={s.id} className="matrix-scatter__legend-item">
                <span className="matrix-scatter__legend-dot" style={{ background: s.color }} />
                {s.shortName}
              </div>
            ))}
          </div>
          <div className="matrix-scatter__legend">
            {QUADRANT_LABELS.map((q) => (
              <div key={q.label} className="matrix-scatter__legend-item matrix-scatter__legend-item--muted">
                <span className="matrix-scatter__legend-dot" style={{ background: q.color }} />
                {q.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="matrix-scatter__chart">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              type="number"
              dataKey="x"
              name="Baseline"
              domain={[0, 100]}
              tick={{ fontSize: 11, fill: '#64748b' }}
              label={{
                value: 'Baseline score (comparable 0–100)',
                position: 'bottom',
                offset: 0,
                style: { fontSize: 11, fill: '#64748b' },
              }}
            />
            <YAxis
              type="number"
              dataKey="y"
              name="Momentum Rate"
              domain={[-50, 60]}
              tick={{ fontSize: 11, fill: '#64748b' }}
              tickFormatter={(v) => `${v}%`}
              label={{
                value: 'Momentum Rate of Change (%)',
                angle: -90,
                position: 'insideLeft',
                offset: 10,
                style: { fontSize: 11, fill: '#64748b' },
              }}
            />
            <ZAxis type="number" dataKey="z" range={[40, 160]} />
            <ReferenceLine x={BASELINE_ESG_THRESHOLD} stroke="#94a3b8" strokeDasharray="4 4" />
            <ReferenceLine y={MOMENTUM_RATE_THRESHOLD} stroke="#94a3b8" strokeDasharray="4 4" />
            <ReferenceLine y={0} stroke="#cbd5e1" strokeWidth={1} />
            <Tooltip
              content={<MultiBaselineTooltip stocks={stocks} visibleMetrics={visibleMetrics} />}
              cursor={{ strokeDasharray: '3 3' }}
            />
            {activeSeries.map((series) => {
              const seriesData = allPoints.filter((p) => p.providerId === series.id);
              return (
                <Scatter
                  key={series.id}
                  name={series.name}
                  data={seriesData}
                  fill={series.color}
                  onClick={handleClick}
                  style={{ cursor: 'pointer' }}
                  shape={(props) => {
                    const { cx, cy, payload } = props;
                    const r = payload.providerId === 'sgx' ? 6 : 4.5;
                    const selected = payload.ticker === selectedTicker;
                    const opacity = payload.opacity ?? 1;
                    return (
                      <circle
                        cx={cx}
                        cy={cy}
                        r={selected ? r + 2 : r}
                        fill={series.color}
                        fillOpacity={opacity}
                        stroke={selected ? '#1e293b' : series.color}
                        strokeWidth={selected ? 2 : 0}
                      />
                    );
                  }}
                />
              );
            })}
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

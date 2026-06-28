import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts';
import './MultiBaselineChart.css';

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="multi-baseline-chart__tooltip">
      <div className="multi-baseline-chart__tooltip-title">{d.fullName}</div>
      <div>Comparable: {d.score}/100</div>
      <div>Native: {d.nativeLabel}</div>
      {d.lowerIsBetter && (
        <div className="multi-baseline-chart__tooltip-note">Lower native risk is better</div>
      )}
    </div>
  );
}

export default function MultiBaselineChart({ stock, visibleMetrics = null }) {
  if (!stock?.agents?.esgBaseline) return null;

  const data = buildMultiBaselineChartData(stock, visibleMetrics);
  if (data.length === 0) return null;
  const spread = Math.max(...data.map((d) => d.score)) - Math.min(...data.map((d) => d.score));

  return (
    <div className="multi-baseline-chart">
      <div className="multi-baseline-chart__header">
        <span className="multi-baseline-chart__title">All baselines · one company</span>
        <span className="multi-baseline-chart__spread">Spread: {spread.toFixed(1)} pts</span>
      </div>
      <div className="multi-baseline-chart__canvas">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 4, right: 12, bottom: 4, left: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
            <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} />
            <YAxis
              type="category"
              dataKey="name"
              width={52}
              tick={{ fontSize: 10, fill: '#475569', fontWeight: 600 }}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: '#f8fafc' }} />
            <ReferenceLine x={stock.baselineEsgScore} stroke="#0ea5e9" strokeDasharray="4 4" />
            <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={18}>
              {data.map((entry) => (
                <Cell key={entry.id} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="multi-baseline-chart__labels">
        {data.map((d) => (
          <div key={d.id} className="multi-baseline-chart__label-row">
            <span style={{ color: d.color, fontWeight: 600 }}>{d.name}</span>
            <span>{d.nativeLabel}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

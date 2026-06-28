import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { X, RefreshCw, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ACTION_SIGNAL_STYLES } from '../../utils/constants';
import ESGDataSourceBadge, { getESGBaselineLive } from '../ESGDataSourceBadge/ESGDataSourceBadge';
import ESGComparisonSelector, { formatProviderScore } from '../ESGComparisonSelector/ESGComparisonSelector';
import MultiBaselineChart from '../MultiBaselineChart/MultiBaselineChart';
import BaselineMetricPicker from '../BaselineMetricPicker/BaselineMetricPicker';
import { buildClientSelectedComparison, filterBaselineSeries } from '../../utils/esgComparison';
import './StockDetailPanel.css';

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #e2e8f0',
        borderRadius: 8,
        padding: '8px 12px',
        fontSize: 12,
      }}
    >
      <div style={{ fontWeight: 600 }}>{label}</div>
      <div style={{ color: '#5a6777' }}>ESG Score: {payload[0].value}</div>
    </div>
  );
}

export default function StockDetailPanel({
  stock,
  isOpen,
  onClose,
  onReanalyze,
  reanalyzing,
  comparisonProvider = 'msci',
  onComparisonChange,
  visibleMetrics = null,
  onVisibleMetricsChange,
}) {
  if (!stock) return null;

  const signalStyle = ACTION_SIGNAL_STYLES[stock.actionSignal] || ACTION_SIGNAL_STYLES.Hold;
  const agents = stock.agents;
  const esgLive = getESGBaselineLive(agents?.esgBaseline);
  const esg = agents?.esgBaseline;
  const activeProvider = comparisonProvider || esg?.comparisonProvider || 'msci';
  const selected = buildClientSelectedComparison(stock, activeProvider);

  const handleComparisonChange = (providerId) => {
    onComparisonChange?.(providerId);
  };

  return (
    <>
      <div
        className={`stock-detail__overlay ${isOpen ? 'stock-detail__overlay--visible' : ''}`}
        onClick={onClose}
      />
      <aside className={`stock-detail ${isOpen ? 'stock-detail--open' : ''}`}>
        <div className="stock-detail__header">
          <div>
            <div className="stock-detail__ticker">{stock.ticker}</div>
            <div className="stock-detail__company">{stock.company}</div>
            <div className="stock-detail__meta">
              <span>{stock.sector}</span>
              <span>·</span>
              <span>{stock.country}</span>
              <span>·</span>
              <span
                style={{
                  background: signalStyle.bg,
                  color: signalStyle.text,
                  padding: '1px 6px',
                  borderRadius: 4,
                  fontWeight: 600,
                }}
              >
                {stock.actionSignal}
              </span>
            </div>
          </div>
          <button className="stock-detail__close" onClick={onClose} aria-label="Close panel">
            <X size={20} />
          </button>
        </div>

        <div className="stock-detail__body">
            <div className="stock-detail__scores">
            <div className="stock-detail__score-card">
              <div className="stock-detail__score-label">Live Price</div>
              <div className="stock-detail__score-value" style={{ fontSize: stock.price ? '1.1rem' : '0.9rem' }}>
                {stock.price != null ? (
                  <>
                    {stock.price} {stock.priceCurrency || ''}
                    {stock.priceLive && ' ●'}
                  </>
                ) : (
                  'N/A'
                )}
              </div>
              {stock.priceChangePct != null && (
                <div style={{ fontSize: '0.7rem', color: stock.priceChangePct >= 0 ? '#00C076' : '#FF4747' }}>
                  {stock.priceChangePct >= 0 ? '+' : ''}
                  {(stock.priceChangePct * 100).toFixed(2)}%
                </div>
              )}
            </div>
            <div className="stock-detail__score-card">
              <div className="stock-detail__score-label">Baseline ESG</div>
              <div className="stock-detail__score-value">{stock.baselineEsgScore}</div>
              {agents?.esgBaseline && (
                <div className="stock-detail__esg-badge-row">
                  <ESGDataSourceBadge live={esgLive} compact />
                </div>
              )}
            </div>
            <div className="stock-detail__score-card">
              <div className="stock-detail__score-label">CGS Momentum</div>
              <div className="stock-detail__score-value" style={{ color: '#5a6777' }}>
                {stock.cgsDynamicMomentumScore}
              </div>
            </div>
            <div className="stock-detail__score-card">
              <div className="stock-detail__score-label">Quadrant</div>
              <div className="stock-detail__score-value" style={{ fontSize: '0.85rem' }}>
                {stock.quadrant}
              </div>
            </div>
            <div className="stock-detail__score-card">
              <div className="stock-detail__score-label">Momentum Rate</div>
              <div className="stock-detail__score-value" style={{ fontSize: '0.95rem' }}>
                {stock.momentumRateOfChange > 0 ? '+' : ''}
                {stock.momentumRateOfChange}%
              </div>
            </div>
          </div>

          <div className="stock-detail__section-title">12-Month ESG Trajectory</div>
          <div className="stock-detail__chart">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stock.esgTrajectory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <Tooltip content={<ChartTooltip />} />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#5a6777"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#5a6777' }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="stock-detail__section-title">Institutional Investment Thesis</div>
          <div className="stock-detail__thesis">{stock.investmentThesis}</div>

          {agents?.esgBaseline && (
            <>
              <div className="stock-detail__section-title stock-detail__section-title--with-badge">
                <span>SGX ESGenome Baseline & Cross-Reference</span>
                <ESGDataSourceBadge live={esgLive} compact />
              </div>

              <MultiBaselineChart stock={stock} visibleMetrics={visibleMetrics} />

              {onVisibleMetricsChange && visibleMetrics && (
                <BaselineMetricPicker
                  visibleMetrics={visibleMetrics}
                  onChange={onVisibleMetricsChange}
                  compact
                />
              )}

              <ESGComparisonSelector
                value={activeProvider}
                onChange={handleComparisonChange}
                compact
              />

              <div className="stock-detail__agent-card stock-detail__agent-card--esg">
                <div className="stock-detail__agent-name">
                  ESGBaselineAgent · {agents.esgBaseline.esgenome.metricsDisclosed}/27 metrics disclosed
                  {!esgLive && (
                    <span className="stock-detail__esg-schema-note"> · SGX 27-metric schema</span>
                  )}
                </div>
                <div className="stock-detail__agent-value">
                  Realtime ESG: {agents.esgBaseline.realtimeEsgScore} · Velocity:{' '}
                  {agents.esgBaseline.velocityOfChange.signal} ({agents.esgBaseline.velocityOfChange.direction})
                </div>

                {selected && (
                  <div className="stock-detail__selected-comparison">
                    <strong>Selected: {selected.provider}</strong> — {selected.displayValue}
                    {' · '}
                    Δ {selected.divergenceFromSGX > 0 ? '+' : ''}
                    {selected.divergenceFromSGX} vs SGX baseline
                    {selected.lowerIsBetter && ' (lower risk is better)'}
                  </div>
                )}

                <div className="stock-detail__esg-providers">
                  {filterBaselineSeries(visibleMetrics).map((p) => {
                    const label =
                      p.id === 'sgx'
                        ? `${esg.baselineEsgScore}/100`
                        : formatProviderScore(esg.crossReference, p.id);
                    return (
                      <span
                        key={p.id}
                        className={`stock-detail__provider-chip ${activeProvider === p.id ? 'stock-detail__provider-chip--selected' : ''} ${p.lowerIsBetter ? 'stock-detail__provider-chip--lower' : ''}`}
                      >
                        {p.shortName}: {label}
                      </span>
                    );
                  })}
                </div>
                <div className="stock-detail__agent-value" style={{ fontSize: '0.75rem', marginTop: 6, color: '#64748b' }}>
                  Provider spread: {agents.esgBaseline.providerDivergence.spread} pts · {agents.esgBaseline.providerDivergence.label}
                </div>
                <div className="stock-detail__thesis" style={{ fontSize: '0.78rem', marginTop: 8 }}>
                  {agents.esgBaseline.problemStatement}
                </div>
              </div>
            </>
          )}

          {agents && (
            <div className="stock-detail__agents">
              <div className="stock-detail__section-title">Agent Pipeline Output</div>
              {agents.esgBaseline && (
                <div className="stock-detail__agent-card">
                  <div className="stock-detail__agent-name stock-detail__agent-name--with-badge">
                    <span>ESGBaselineAgent · SGXFIRST {agents.esgBaseline.sgxFirst.firstRating}</span>
                    <ESGDataSourceBadge live={esgLive} compact />
                  </div>
                  <div className="stock-detail__agent-value">
                    SGXFIRST Score: {agents.esgBaseline.sgxFirst.firstScore} · Peer percentile:{' '}
                    {agents.esgBaseline.sgxFirst.peerBenchmarkPercentile}%
                  </div>
                </div>
              )}
              <div className="stock-detail__agent-card">
                <div className="stock-detail__agent-name">
                  NewsScoutAgent {agents.newsScout.live ? '· LIVE WEB' : '· simulated'}
                </div>
                <div className="stock-detail__agent-value">
                  Sentiment: {agents.newsScout.newsSentimentMultiplier} ({agents.newsScout.sentimentLabel})
                </div>
                {agents.newsScout.parsedHeadlines?.length > 0 && (
                  <ul className="stock-detail__headlines">
                    {agents.newsScout.parsedHeadlines.slice(0, 3).map((h, i) => (
                      <li key={i}>{h}</li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="stock-detail__agent-card">
                <div className="stock-detail__agent-name">InnovationAnalystAgent</div>
                <div className="stock-detail__agent-value">
                  Digital & AI Maturity: {agents.innovationAnalyst.digitalAiMaturityIndex}/100 (
                  {agents.innovationAnalyst.maturityLabel})
                </div>
              </div>
              {agents.crowdSentiment && (
                <div className="stock-detail__agent-card">
                  <div className="stock-detail__agent-name stock-detail__agent-name--with-badge">
                    <span>CrowdSentimentAgent · Forum</span>
                    <Link
                      to={`/forum?ticker=${encodeURIComponent(stock.ticker)}`}
                      className="stock-detail__forum-link"
                    >
                      <MessageSquare size={12} />
                      Discuss
                    </Link>
                  </div>
                  <div className="stock-detail__agent-value">
                    {agents.crowdSentiment.label} · Score {agents.crowdSentiment.crowdSentiment} (
                    {agents.crowdSentiment.commentCount} comments)
                  </div>
                  {agents.crowdSentiment.recentTopics?.length > 0 && (
                    <div className="stock-detail__crowd-topics">
                      {agents.crowdSentiment.recentTopics.join(' · ')}
                    </div>
                  )}
                </div>
              )}
              <div className="stock-detail__agent-card">
                <div className="stock-detail__agent-name">PortfolioOrchestratorAgent</div>
                <div className="stock-detail__agent-value">
                  Dynamic Score: {agents.portfolioOrchestrator.cgsDynamicMomentumScore} ·{' '}
                  {agents.portfolioOrchestrator.quadrant}
                </div>
              </div>
            </div>
          )}

          <button
            className="stock-detail__refresh"
            onClick={() => onReanalyze?.(stock.ticker)}
            disabled={reanalyzing}
          >
            <RefreshCw size={16} className={reanalyzing ? 'animate-spin' : ''} />
            {reanalyzing ? 'Re-running Agent Pipeline...' : 'Re-analyze via Agent Pipeline'}
          </button>
        </div>
      </aside>
    </>
  );
}

import { useEffect, useState } from 'react';
import {
  FileText,
  Link2,
  Upload,
  Loader2,
  Sparkles,
  Leaf,
  Users,
  Shield,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import {
  analyzeReportUrl,
  analyzeReportUpload,
  fetchReportTickers,
} from '../../services/api';
import { ACTION_SIGNAL_STYLES } from '../../utils/constants';
import './ESGReportAnalyzer.css';

function PillarCard({ title, icon: Icon, color, pillar, score }) {
  return (
    <div className="report-pillar">
      <div className="report-pillar__header" style={{ color }}>
        <Icon size={18} />
        <span>{title}</span>
        <span className="report-pillar__score">{score}/100</span>
      </div>
      <p className="report-pillar__summary">{pillar.summary}</p>
      {pillar.highlights?.length > 0 && (
        <ul className="report-pillar__list report-pillar__list--pos">
          {pillar.highlights.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
      {pillar.risks?.length > 0 && (
        <ul className="report-pillar__list report-pillar__list--neg">
          {pillar.risks.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function ESGReportAnalyzer() {
  const [mode, setMode] = useState('url');
  const [url, setUrl] = useState('');
  const [file, setFile] = useState(null);
  const [ticker, setTicker] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [tickers, setTickers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  useEffect(() => {
    fetchReportTickers()
      .then((data) => setTickers(data.tickers || []))
      .catch(() => setTickers([]));
  }, []);

  const handleTickerChange = (value) => {
    setTicker(value);
    const stock = tickers.find((t) => t.ticker === value);
    if (stock) setCompanyName(stock.company);
  };

  const handleAnalyze = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const payload = { ticker: ticker || undefined, companyName: companyName || undefined };
      const data =
        mode === 'url'
          ? await analyzeReportUrl({ url: url.trim(), ...payload })
          : await analyzeReportUpload({ file, ...payload });
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const analysis = result?.analysis;
  const recStyle = analysis
    ? ACTION_SIGNAL_STYLES[analysis.recommendation] || ACTION_SIGNAL_STYLES.Hold
    : null;

  return (
    <div className="esg-report-analyzer">
      <div className="esg-report-analyzer__hero">
        <div>
          <h1>
            <FileText size={28} />
            ESG Report Analyzer
          </h1>
          <p>
            Upload a financial report or paste a URL — AI extracts ESG signals and delivers
            findings, pillar analysis, and investment recommendation.
          </p>
        </div>
      </div>

      <div className="esg-report-analyzer__input-card">
        <div className="esg-report-analyzer__tabs">
          <button
            type="button"
            className={mode === 'url' ? 'active' : ''}
            onClick={() => setMode('url')}
          >
            <Link2 size={16} /> URL Link
          </button>
          <button
            type="button"
            className={mode === 'upload' ? 'active' : ''}
            onClick={() => setMode('upload')}
          >
            <Upload size={16} /> Upload File
          </button>
        </div>

        <form onSubmit={handleAnalyze}>
          <div className="esg-report-analyzer__meta-row">
            <select value={ticker} onChange={(e) => handleTickerChange(e.target.value)}>
              <option value="">Link to stock (optional)</option>
              {tickers.map((t) => (
                <option key={t.ticker} value={t.ticker}>
                  {t.ticker} — {t.company}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Company name override (optional)"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
            />
          </div>

          {mode === 'url' ? (
            <input
              type="url"
              placeholder="https://example.com/annual-report-2025.pdf"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
            />
          ) : (
            <label className="esg-report-analyzer__dropzone">
              <input
                type="file"
                accept=".pdf,.txt,.md,text/plain,application/pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                required
              />
              {file ? (
                <span>
                  <CheckCircle2 size={20} /> {file.name} ({Math.round(file.size / 1024)} KB)
                </span>
              ) : (
                <span>
                  <Upload size={24} />
                  Drop PDF, TXT, or MD (max 10 MB)
                </span>
              )}
            </label>
          )}

          {error && (
            <div className="esg-report-analyzer__error">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <button type="submit" disabled={loading || (mode === 'upload' && !file)}>
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Analyzing ESG disclosure… (may take 30–60s)
              </>
            ) : (
              <>
                <Sparkles size={18} /> Analyze ESG Report
              </>
            )}
          </button>
        </form>
      </div>

      {analysis && (
        <div className="esg-report-analyzer__results">
          <div className="esg-report-analyzer__results-header">
            <div>
              <h2>{analysis.companyName}</h2>
              <p>
                {analysis.reportType} · {result.extraction.sourceLabel}
                {analysis.aiPowered ? (
                  <span className="esg-report-analyzer__ai-badge">
                    <Sparkles size={12} /> Gen AI
                  </span>
                ) : (
                  <span className="esg-report-analyzer__ai-badge esg-report-analyzer__ai-badge--fallback">
                    Keyword fallback
                  </span>
                )}
              </p>
            </div>
            <div className="esg-report-analyzer__score-block">
              <span className="esg-report-analyzer__score-label">ESG Score</span>
              <span className="esg-report-analyzer__score-value">{analysis.esgScore}</span>
            </div>
          </div>

          <div
            className="esg-report-analyzer__recommendation"
            style={{
              background: recStyle.bg,
              borderColor: recStyle.border,
              color: recStyle.text,
            }}
          >
            <strong>Recommendation: {analysis.recommendation}</strong>
            <p>{analysis.recommendationRationale}</p>
          </div>

          <div className="esg-report-analyzer__summary-card">
            <h3>Executive Summary</h3>
            <p>{analysis.findingsSummary}</p>
          </div>

          <div className="esg-report-analyzer__pillars">
            <PillarCard
              title="Environmental"
              icon={Leaf}
              color="#059669"
              pillar={analysis.environmental}
              score={analysis.pillarScores?.environmental}
            />
            <PillarCard
              title="Social"
              icon={Users}
              color="#2563eb"
              pillar={analysis.social}
              score={analysis.pillarScores?.social}
            />
            <PillarCard
              title="Governance"
              icon={Shield}
              color="#7c3aed"
              pillar={analysis.governance}
              score={analysis.pillarScores?.governance}
            />
          </div>

          <div className="esg-report-analyzer__grid">
            <div className="esg-report-analyzer__list-card">
              <h3>Key Findings</h3>
              <ul>
                {analysis.keyFindings.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div className="esg-report-analyzer__list-card">
              <h3>Action Items</h3>
              <ul>
                {analysis.actionItems.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>

          {analysis.dataGaps?.length > 0 && (
            <div className="esg-report-analyzer__gaps">
              <h3>Data Gaps & Disclosure Risks</h3>
              <ul>
                {analysis.dataGaps.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

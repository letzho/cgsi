import { useEffect, useRef, useState } from 'react';
import { Newspaper, Sparkles, Loader2, ExternalLink, RefreshCw } from 'lucide-react';
import { fetchVeritaNews, subscribeVeritaNewsStream } from '../../services/api';
import './VeritaNews.css';

const TONE_COLORS = {
  Bullish: { bg: '#e6faf3', text: '#00875a' },
  Bearish: { bg: '#fef2f2', text: '#dc2626' },
  Mixed: { bg: '#fff7ed', text: '#c2410c' },
  Neutral: { bg: '#f1f5f9', text: '#475569' },
};

function formatPubDate(pub) {
  if (!pub) return '';
  const d = new Date(pub);
  if (Number.isNaN(d.getTime())) return pub;
  return d.toLocaleString('en-SG', {
    timeZone: 'Asia/Singapore',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export default function VeritaNews() {
  const [headlines, setHeadlines] = useState([]);
  const [aiSummary, setAiSummary] = useState(null);
  const [overnightWindow, setOvernightWindow] = useState('');
  const [loading, setLoading] = useState(true);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState(null);
  const [fetchedAt, setFetchedAt] = useState(null);
  const [aiEnabled, setAiEnabled] = useState(false);
  const [feedMode, setFeedMode] = useState('asean');
  const [tagline, setTagline] = useState('Overnight & off-hours ASEAN ESG wire — AI morning brief');
  const unsubscribeRef = useRef(null);

  const applyBundleMeta = (res) => {
    setHeadlines(res.headlines || []);
    setAiSummary(res.aiSummary || null);
    setOvernightWindow(res.overnightWindow || '');
    setFetchedAt(res.fetchedAt);
    setAiEnabled(res.aiEnabled);
    setFeedMode(res.feedMode || 'asean');
    if (res.tagline) {
      setTagline(`${res.tagline} — AI morning brief`);
    }
  };

  const startStream = () => {
    if (unsubscribeRef.current) unsubscribeRef.current();

    setHeadlines([]);
    setAiSummary(null);
    setStreaming(true);
    setLoading(true);
    setError(null);

    unsubscribeRef.current = subscribeVeritaNewsStream({
      onMessage: (event) => {
        if (event.type === 'window') {
          setOvernightWindow(event.overnightWindow || '');
          setFetchedAt(event.fetchedAt);
          if (event.feedMode) setFeedMode(event.feedMode);
          if (event.tagline) setTagline(`${event.tagline} — AI morning brief`);
        }
        if (event.type === 'headline') {
          setHeadlines((prev) => [...prev, event.headline]);
        }
        if (event.type === 'summary') {
          setAiSummary(event.aiSummary);
          setAiEnabled(event.aiEnabled);
          setLoading(false);
          setStreaming(false);
        }
        if (event.type === 'complete') {
          setLoading(false);
          setStreaming(false);
        }
        if (event.type === 'error') {
          setError(event.message);
          setLoading(false);
          setStreaming(false);
        }
      },
      onError: () => {
        setError('News stream disconnected');
        setLoading(false);
        setStreaming(false);
      },
    });
  };

  useEffect(() => {
    startStream();
    return () => {
      if (unsubscribeRef.current) unsubscribeRef.current();
    };
  }, []);

  const handleRefresh = () => {
    if (unsubscribeRef.current) unsubscribeRef.current();
    fetchVeritaNews(true)
      .then((res) => {
        applyBundleMeta(res);
        setError(null);
      })
      .catch((err) => setError(err.message))
      .finally(() => {
        setLoading(false);
        setStreaming(false);
      });
    setLoading(true);
    setStreaming(false);
  };

  const toneStyle = TONE_COLORS[aiSummary?.marketTone] || TONE_COLORS.Neutral;

  return (
    <section className="verita-news">
      <div className="verita-news__header">
        <div className="verita-news__brand">
          <Newspaper size={20} />
          <div>
            <h2>Verita News</h2>
            <p>{tagline}</p>
          </div>
        </div>
        <div className="verita-news__actions">
          {streaming && (
            <span className="verita-news__live">
              <span className="verita-news__live-dot" />
              Streaming
            </span>
          )}
          <button type="button" className="verita-news__refresh" onClick={handleRefresh} title="Refresh">
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {overnightWindow && (
        <div className="verita-news__window">{overnightWindow}</div>
      )}

      {feedMode !== 'asean' && (
        <div className="verita-news__spillover">
          {feedMode === 'global_spillover'
            ? 'US/global headlines with potential ASEAN market spillover.'
            : 'ASEAN headlines with US/global spillover stories where regional coverage is thin.'}
        </div>
      )}

      {error && <div className="verita-news__error">{error}</div>}

      <div className="verita-news__body">
        <div className="verita-news__feed">
          <h3>Headline stream</h3>
          {loading && headlines.length === 0 ? (
            <div className="verita-news__loading">
              <Loader2 size={18} className="animate-spin" />
              Fetching overnight headlines…
            </div>
          ) : headlines.length === 0 ? (
            <p className="verita-news__empty">No overnight headlines in the current window.</p>
          ) : (
            <ul className="verita-news__list">
              {headlines.map((item, i) => (
                <li key={`${item.title}-${i}`} className="verita-news__item">
                  <span className="verita-news__item-index">{i + 1}</span>
                  <div className="verita-news__item-body">
                    {item.feed === 'global_spillover' && (
                      <span className="verita-news__feed-badge">Global → ASEAN</span>
                    )}
                    {item.link ? (
                      <a href={item.link} target="_blank" rel="noopener noreferrer">
                        {item.title}
                        <ExternalLink size={12} />
                      </a>
                    ) : (
                      <span>{item.title}</span>
                    )}
                    <span className="verita-news__item-meta">
                      {item.source && <span>{item.source}</span>}
                      {item.publishedAt && <span>{formatPubDate(item.publishedAt)}</span>}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="verita-news__summary">
          <div className="verita-news__summary-header">
            <h3>
              <Sparkles size={16} />
              AI Overnight Brief
            </h3>
            {aiSummary?.marketTone && (
              <span
                className="verita-news__tone"
                style={{ background: toneStyle.bg, color: toneStyle.text }}
              >
                {aiSummary.marketTone}
              </span>
            )}
          </div>

          {loading && !aiSummary ? (
            <div className="verita-news__loading verita-news__loading--summary">
              <Loader2 size={18} className="animate-spin" />
              {aiEnabled ? 'OpenAI summarizing off-hours news…' : 'Generating brief…'}
            </div>
          ) : aiSummary ? (
            <>
              <h4 className="verita-news__brief-title">{aiSummary.title}</h4>
              <p className="verita-news__overview">{aiSummary.overview}</p>
              {aiSummary.bullets?.length > 0 && (
                <ul className="verita-news__bullets">
                  {aiSummary.bullets.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              )}
              {aiSummary.esgHighlights?.length > 0 && (
                <div className="verita-news__esg">
                  <strong>ESG highlights</strong>
                  <ul>
                    {aiSummary.esgHighlights.map((h) => (
                      <li key={h}>{h}</li>
                    ))}
                  </ul>
                </div>
              )}
              {aiSummary.aseanImplications?.length > 0 && (
                <div className="verita-news__asean-impact">
                  <strong>ASEAN market implications</strong>
                  <ul>
                    {aiSummary.aseanImplications.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
              {aiSummary.watchlist?.length > 0 && (
                <div className="verita-news__watchlist">
                  Watch: {aiSummary.watchlist.join(' · ')}
                </div>
              )}
              <div className="verita-news__method">
                <Sparkles size={12} />
                {aiSummary.method === 'openai' ? 'Powered by Intelligent AI' : 'Powered by Ixeven'}
              </div>
            </>
          ) : null}
        </div>
      </div>

      {fetchedAt && (
        <div className="verita-news__footer">
          Updated {new Date(fetchedAt).toLocaleString('en-SG', { timeZone: 'Asia/Singapore' })}
        </div>
      )}
    </section>
  );
}

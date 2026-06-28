import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  MessageSquare,
  Send,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Minus,
  Loader2,
} from 'lucide-react';
import {
  fetchForumComments,
  fetchForumSummary,
  postForumComment,
  previewCommentSentiment,
} from '../../services/api';
import './InvestorForum.css';

const SENTIMENT_STYLES = {
  Bullish: { bg: '#e6faf3', text: '#00875a', border: '#00C076', icon: TrendingUp },
  Bearish: { bg: '#fef2f2', text: '#dc2626', border: '#FF4747', icon: TrendingDown },
  Neutral: { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1', icon: Minus },
};

function SentimentBadge({ sentiment, compact = false }) {
  if (!sentiment) return null;
  const style = SENTIMENT_STYLES[sentiment.label] || SENTIMENT_STYLES.Neutral;
  const Icon = style.icon;

  return (
    <span
      className={`forum-sentiment ${compact ? 'forum-sentiment--compact' : ''}`}
      style={{
        background: style.bg,
        color: style.text,
        borderColor: style.border,
      }}
      title={sentiment.reason}
    >
      <Icon size={compact ? 12 : 14} />
      {sentiment.label}
      {!compact && (
        <span className="forum-sentiment__score">
          {sentiment.score > 0 ? '+' : ''}
          {sentiment.score}
        </span>
      )}
    </span>
  );
}

function crowdBarColor(score) {
  if (score > 0.2) return '#00C076';
  if (score < -0.2) return '#FF4747';
  return '#94a3b8';
}

export default function InvestorForum() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTicker = searchParams.get('ticker') || '';

  const [summary, setSummary] = useState([]);
  const [comments, setComments] = useState([]);
  const [selectedTicker, setSelectedTicker] = useState(initialTicker);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [author, setAuthor] = useState('');
  const [text, setText] = useState('');
  const [preview, setPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [summaryRes, commentsRes] = await Promise.all([
        fetchForumSummary(),
        fetchForumComments(selectedTicker || null),
      ]);
      setSummary(summaryRes.summary || []);
      setComments(commentsRes.comments || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedTicker]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!text.trim() || text.trim().length < 12) {
      setPreview(null);
      return undefined;
    }

    const timer = setTimeout(async () => {
      setPreviewLoading(true);
      try {
        const res = await previewCommentSentiment(text, selectedTicker || summary[0]?.ticker);
        setPreview(res.sentiment);
      } catch {
        setPreview(null);
      } finally {
        setPreviewLoading(false);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [text, selectedTicker, summary]);

  const activeSummary = useMemo(
    () => summary.find((s) => s.ticker === selectedTicker),
    [summary, selectedTicker]
  );

  const handleSelectTicker = (ticker) => {
    setSelectedTicker(ticker);
    if (ticker) {
      setSearchParams({ ticker });
    } else {
      setSearchParams({});
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const ticker = selectedTicker || summary.find((s) => s.commentCount > 0)?.ticker;
    if (!ticker) {
      setError('Select a stock ticker before posting.');
      return;
    }

    setPosting(true);
    setError(null);
    try {
      await postForumComment({
        ticker,
        author: author.trim() || 'anonymous',
        text: text.trim(),
      });
      setText('');
      setPreview(null);
      if (!selectedTicker) setSelectedTicker(ticker);
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setPosting(false);
    }
  };

  const postTicker = selectedTicker || summary[0]?.ticker || '';

  return (
    <div className="investor-forum">
      <div className="investor-forum__hero">
        <div>
          <h1>
            <MessageSquare size={28} />
            Investor Forum
          </h1>
          <p>
            Discuss ASEAN equities — every comment is scored by AI for ESG investment sentiment
            and feeds the CrowdSentimentAgent pipeline.
          </p>
        </div>
        <div className="investor-forum__hero-stat">
          <span className="investor-forum__hero-label">Comments analyzed</span>
          <span className="investor-forum__hero-value">{comments.length}</span>
        </div>
      </div>

      <div className="investor-forum__layout">
        <aside className="investor-forum__sidebar">
          <div className="investor-forum__sidebar-header">
            <h3>Crowd Sentiment Heatmap</h3>
            <button
              type="button"
              className={`investor-forum__filter-btn ${!selectedTicker ? 'investor-forum__filter-btn--active' : ''}`}
              onClick={() => handleSelectTicker('')}
            >
              All
            </button>
          </div>

          <div className="investor-forum__ticker-list">
            {summary.map((item) => {
              const width = Math.abs(item.crowdSentiment) * 50 + 10;
              const isActive = selectedTicker === item.ticker;

              return (
                <button
                  key={item.ticker}
                  type="button"
                  className={`investor-forum__ticker-card ${isActive ? 'investor-forum__ticker-card--active' : ''}`}
                  onClick={() => handleSelectTicker(item.ticker)}
                >
                  <div className="investor-forum__ticker-top">
                    <span className="investor-forum__ticker-symbol">{item.ticker}</span>
                    <span className="investor-forum__ticker-count">{item.commentCount}</span>
                  </div>
                  <div className="investor-forum__ticker-company">{item.company}</div>
                  <div className="investor-forum__crowd-bar">
                    <div
                      className="investor-forum__crowd-fill"
                      style={{
                        width: `${width}%`,
                        background: crowdBarColor(item.crowdSentiment),
                      }}
                    />
                  </div>
                  <div className="investor-forum__ticker-meta">
                    <span>{item.label}</span>
                    {item.commentCount > 0 && (
                      <span>
                        {item.crowdSentiment > 0 ? '+' : ''}
                        {item.crowdSentiment}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        <main className="investor-forum__main">
          {activeSummary && activeSummary.commentCount > 0 && (
            <div className="investor-forum__active-banner">
              <div>
                <strong>{activeSummary.ticker}</strong> · {activeSummary.company}
              </div>
              <div className="investor-forum__active-stats">
                <span>{activeSummary.label}</span>
                <span>{activeSummary.bullishPct}% bullish</span>
                <span>Score {activeSummary.crowdSentiment}</span>
              </div>
            </div>
          )}

          {error && <div className="investor-forum__error">{error}</div>}

          {loading ? (
            <div className="investor-forum__loading">
              <Loader2 size={24} className="animate-spin" />
              Loading discussions...
            </div>
          ) : comments.length === 0 ? (
            <div className="investor-forum__empty">
              No comments yet{selectedTicker ? ` for ${selectedTicker}` : ''}. Be the first to
              share your ESG investment view.
            </div>
          ) : (
            <div className="investor-forum__comments">
              {comments.map((comment) => (
                <article key={comment.id} className="investor-forum__comment">
                  <div className="investor-forum__comment-header">
                    <div>
                      <span className="investor-forum__author">@{comment.author}</span>
                      <span className="investor-forum__ticker-tag">{comment.ticker}</span>
                    </div>
                    <SentimentBadge sentiment={comment.sentiment} />
                  </div>
                  <p className="investor-forum__comment-text">{comment.text}</p>
                  {comment.sentiment?.topics?.length > 0 && (
                    <div className="investor-forum__topics">
                      {comment.sentiment.topics.map((topic) => (
                        <span key={topic} className="investor-forum__topic">
                          {topic}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="investor-forum__comment-footer">
                    <span>{new Date(comment.createdAt).toLocaleString()}</span>
                    <span className="investor-forum__method">
                      <Sparkles size={12} />
                      {comment.sentiment?.method === 'openai' ? 'Gen AI' : 'AI sentiment'}
                    </span>
                    {comment.sentiment?.reason && (
                      <span className="investor-forum__reason">{comment.sentiment.reason}</span>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}

          <form className="investor-forum__compose" onSubmit={handleSubmit}>
            <h3>Post a comment</h3>
            <div className="investor-forum__compose-row">
              <input
                type="text"
                placeholder="Display name (optional)"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                maxLength={40}
              />
              <select
                value={postTicker}
                onChange={(e) => handleSelectTicker(e.target.value)}
                required
              >
                <option value="">Select ticker...</option>
                {summary.map((s) => (
                  <option key={s.ticker} value={s.ticker}>
                    {s.ticker} — {s.company}
                  </option>
                ))}
              </select>
            </div>
            <textarea
              placeholder="Share your ESG investment view... (AI sentiment runs on each comment)"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
              required
              minLength={8}
            />
            <div className="investor-forum__compose-footer">
              <div className="investor-forum__preview">
                {previewLoading && (
                  <span className="investor-forum__preview-loading">
                    <Loader2 size={14} className="animate-spin" /> Analyzing...
                  </span>
                )}
                {!previewLoading && preview && <SentimentBadge sentiment={preview} compact />}
                {!previewLoading && preview?.reason && (
                  <span className="investor-forum__preview-reason">{preview.reason}</span>
                )}
              </div>
              <button type="submit" disabled={posting || !text.trim() || !postTicker}>
                {posting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Posting...
                  </>
                ) : (
                  <>
                    <Send size={16} /> Post & Analyze
                  </>
                )}
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}

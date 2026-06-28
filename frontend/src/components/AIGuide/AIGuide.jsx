import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { Bot, X, Send, Sparkles, Minimize2, Maximize2 } from 'lucide-react';
import { chatWithGuide, fetchGuideWelcome, fetchAIStatus } from '../../services/api';
import './AIGuide.css';

function renderMarkdown(text) {
  return text
    .split('\n')
    .map((line, i) => {
      const parts = line.split(/(\*\*[^*]+\*\*)/g).map((part, j) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={j}>{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith('*') && part.endsWith('*') && !part.startsWith('**')) {
          return <em key={j}>{part.slice(1, -1)}</em>;
        }
        return part;
      });
      return (
        <span key={i} className="ai-guide__line">
          {parts}
          {i < text.split('\n').length - 1 && <br />}
        </span>
      );
    });
}

export default function AIGuide({ selectedTicker = null, stocksCount = 0 }) {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [quickPrompts, setQuickPrompts] = useState([]);
  const [hasWelcomed, setHasWelcomed] = useState(false);
  const [aiStatus, setAiStatus] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const page = location.pathname === '/' ? 'dashboard' : location.pathname.slice(1);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  useEffect(() => {
    fetchAIStatus().then(setAiStatus).catch(() => {});
  }, []);

  const loadWelcome = useCallback(async () => {
    try {
      const data = await fetchGuideWelcome(page, selectedTicker);
      setQuickPrompts(data.quickPrompts || []);
      if (data.ai) setAiStatus(data.ai);
      if (!hasWelcomed) {
        setMessages([{ role: 'agent', content: data.message, meta: { welcome: true } }]);
        setHasWelcomed(true);
      }
    } catch {
      setMessages([
        {
          role: 'agent',
          content:
            "Hi! I'm **CGS GuideAgent**. Ask me to explain the matrix, Hidden Winners, any stock ticker, or how to earn talk tickets.",
        },
      ]);
    }
  }, [page, selectedTicker, hasWelcomed]);

  useEffect(() => {
    if (open && messages.length === 0) {
      loadWelcome();
    }
  }, [open, messages.length, loadWelcome]);

  useEffect(() => {
    if (open && selectedTicker) {
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.meta?.stockNotice === selectedTicker) return prev;
        return [
          ...prev,
          {
            role: 'agent',
            content: `📌 **${selectedTicker}** is now selected. Ask me *"Explain this stock"* for an instant breakdown.`,
            meta: { stockNotice: selectedTicker },
          },
        ];
      });
    }
  }, [selectedTicker, open]);

  const sendMessage = async (text) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: trimmed }]);
    setLoading(true);

    try {
      const data = await chatWithGuide(trimmed, {
        page,
        selectedTicker,
        stocksCount,
        hiddenWinnersCount: undefined,
      });

      setMessages((prev) => [
        ...prev,
        {
          role: 'agent',
          content: data.message,
          suggestions: data.suggestions,
          meta: { intent: data.intent, latencyMs: data.latencyMs, aiPowered: data.aiPowered },
        },
      ]);
      if (data.suggestions?.length) {
        setQuickPrompts(
          data.suggestions.map((s, i) => ({ id: `sug-${i}`, label: s, message: s }))
        );
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'agent',
          content:
            "Sorry, I couldn't reach the Guide Agent. Make sure the backend is running on port **3001**.",
        },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <div className={`ai-guide ${expanded ? 'ai-guide--expanded' : ''}`}>
      {open && (
        <div className="ai-guide__panel">
          <header className="ai-guide__header">
            <div className="ai-guide__header-left">
              <div className="ai-guide__avatar">
                <Bot size={20} />
                <span className="ai-guide__avatar-pulse" />
              </div>
              <div>
                <div className="ai-guide__title">CGS GuideAgent</div>
                <div className="ai-guide__subtitle">
                  <Sparkles size={10} />
                  {aiStatus?.enabled
                    ? `Generative AI · ${aiStatus.model || 'LLM'}`
                    : 'Rule-based · add OPENAI_API_KEY'}
                </div>
              </div>
            </div>
            <div className="ai-guide__header-actions">
              <button
                type="button"
                onClick={() => setExpanded((e) => !e)}
                aria-label={expanded ? 'Minimize' : 'Expand'}
              >
                {expanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close">
                <X size={18} />
              </button>
            </div>
          </header>

          <div className="ai-guide__messages">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`ai-guide__bubble ai-guide__bubble--${msg.role}`}
              >
                {msg.role === 'agent' && (
                  <div className="ai-guide__bubble-icon">
                    <Bot size={14} />
                  </div>
                )}
                <div className="ai-guide__bubble-content">{renderMarkdown(msg.content)}</div>
                {msg.meta?.aiPowered && (
                  <div className="ai-guide__ai-tag">✨ Generative response</div>
                )}
                {msg.meta?.latencyMs && (
                  <div className="ai-guide__latency">{msg.meta.latencyMs}ms</div>
                )}
              </div>
            ))}

            {loading && (
              <div className="ai-guide__bubble ai-guide__bubble--agent">
                <div className="ai-guide__bubble-icon">
                  <Bot size={14} />
                </div>
                <div className="ai-guide__typing">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {quickPrompts.length > 0 && (
            <div className="ai-guide__chips">
              {quickPrompts.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className="ai-guide__chip"
                  onClick={() => sendMessage(p.message || p.label)}
                  disabled={loading}
                >
                  {p.label}
                </button>
              ))}
            </div>
          )}

          <form className="ai-guide__input-row" onSubmit={handleSubmit}>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                selectedTicker
                  ? `Ask about ${selectedTicker} or the dashboard…`
                  : 'Ask anything about ESG, stocks, matrix…'
              }
              disabled={loading}
            />
            <button type="submit" disabled={loading || !input.trim()} aria-label="Send">
              <Send size={18} />
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        className={`ai-guide__fab ${open ? 'ai-guide__fab--open' : ''}`}
        onClick={() => setOpen((o) => !o)}
        aria-label="Open AI guide"
      >
        {open ? <X size={24} /> : <Bot size={24} />}
        {!open && <span className="ai-guide__fab-ring" />}
        {!open && <span className="ai-guide__fab-label">AI Guide</span>}
      </button>
    </div>
  );
}

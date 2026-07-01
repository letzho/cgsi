const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/api`
  : '/api';

async function request(endpoint, options = {}) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || `API error: ${response.status}`);
  }

  return response.json();
}

export async function fetchStocks(comparisonProvider = 'msci') {
  const params = new URLSearchParams();
  if (comparisonProvider) params.set('comparison', comparisonProvider);
  const qs = params.toString();
  return request(qs ? `/stocks?${qs}` : '/stocks');
}

export async function analyzeStock(ticker, comparisonProvider = 'msci') {
  return request('/analyze', {
    method: 'POST',
    body: JSON.stringify({ ticker, comparisonProvider }),
  });
}

export async function fetchAlphaBasket() {
  return request('/alpha-basket');
}

export async function fetchIndices() {
  return request('/indices');
}

export async function fetchHealth() {
  return request('/health');
}

export async function fetchAIStatus() {
  return request('/ai/status');
}

export async function chatWithGuide(message, context = {}) {
  return request('/guide/chat', {
    method: 'POST',
    body: JSON.stringify({ message, context }),
  });
}

export async function fetchGuideWelcome(page = 'dashboard', selectedTicker = null) {
  const params = new URLSearchParams({ page });
  if (selectedTicker) params.set('selectedTicker', selectedTicker);
  return request(`/guide/welcome?${params}`);
}

export async function fetchESGMethodologies() {
  return request('/esg/methodologies');
}

export async function fetchESGBaseline(ticker) {
  return request(`/esg/baseline/${encodeURIComponent(ticker)}`);
}

export function subscribeESGStream({ ticker = null, onMessage, onError } = {}) {
  const params = ticker ? `?ticker=${encodeURIComponent(ticker)}` : '';
  const source = new EventSource(`${API_BASE}/esg/stream${params}`);

  source.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onMessage?.(data);
    } catch (err) {
      onError?.(err);
    }
  };

  source.onerror = (err) => {
    onError?.(err);
  };

  return () => source.close();
}

export async function fetchVeritaNews(refresh = false) {
  const qs = refresh ? '?refresh=true' : '';
  return request(`/verita-news${qs}`);
}

export function subscribeVeritaNewsStream({ onMessage, onError } = {}) {
  const source = new EventSource(`${API_BASE}/verita-news/stream`);

  source.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onMessage?.(data);
    } catch (err) {
      onError?.(err);
    }
  };

  source.onerror = (err) => {
    onError?.(err);
  };

  return () => source.close();
}

export async function fetchForumComments(ticker = null) {
  const params = ticker ? `?ticker=${encodeURIComponent(ticker)}` : '';
  return request(`/forum/comments${params}`);
}

export async function fetchForumSummary() {
  return request('/forum/summary');
}

export async function postForumComment({ ticker, author, text }) {
  return request('/forum/comments', {
    method: 'POST',
    body: JSON.stringify({ ticker, author, text }),
  });
}

export async function previewCommentSentiment(text, ticker) {
  return request('/forum/analyze-preview', {
    method: 'POST',
    body: JSON.stringify({ text, ticker }),
  });
}

export async function fetchReportTickers() {
  return request('/reports/tickers');
}

export async function analyzeReportUrl({ url, ticker, companyName }) {
  return request('/reports/analyze-url', {
    method: 'POST',
    body: JSON.stringify({ url, ticker, companyName }),
  });
}

export async function analyzeReportUpload({ file, ticker, companyName }) {
  const form = new FormData();
  form.append('file', file);
  if (ticker) form.append('ticker', ticker);
  if (companyName) form.append('companyName', companyName);

  const response = await fetch(`${API_BASE}/reports/analyze-upload`, {
    method: 'POST',
    body: form,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || `API error: ${response.status}`);
  }

  return response.json();
}

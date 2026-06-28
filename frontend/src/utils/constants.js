export const MOO_COLORS = {
  orange: '#FF6900',
  orangeLight: '#FF8534',
  orangeDark: '#E55D00',
  green: '#00C076',
  red: '#FF4747',
  dark: '#0f0f12',
  darkCard: '#1a1a22',
  bg: '#f5f6f8',
};

export const QUADRANT_COLORS = {
  hidden_winners: '#00C076',
  future_leaders: '#3b82f6',
  value_traps: '#FF4747',
  overrated_leaders: '#FF6900',
};

export const ACTION_SIGNAL_STYLES = {
  Buy: { bg: '#e6faf3', text: '#00875a', border: '#00C076' },
  Underweight: { bg: '#fff8f3', text: '#c2410c', border: '#FF6900' },
  Short: { bg: '#fef2f2', text: '#dc2626', border: '#FF4747' },
  Hold: { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' },
};

export const ESG_COMPARISON_PROVIDERS = [
  {
    id: 'msci',
    name: 'MSCI ESG Ratings',
    scale: 'AAA – CCC',
    description:
      'Industry-relative scale. Evaluates unique risk exposure based on GICS sector materiality.',
    lowerIsBetter: false,
  },
  {
    id: 'sp_global',
    name: 'S&P Global ESG Score',
    scale: '0 – 100',
    description:
      'Leans heavily on Corporate Sustainability Assessment (CSA) questionnaires and public disclosures.',
    lowerIsBetter: false,
  },
  {
    id: 'sustainalytics',
    name: 'Morningstar Sustainalytics',
    scale: 'Unmanaged ESG Risk',
    description:
      'Absolute risk scale — lower is better. 0–10 negligible, 40+ severe.',
    lowerIsBetter: true,
  },
];

export const ESG_COMPARISON_STORAGE_KEY = 'cgsi_esg_comparison_provider';
export const ESG_VISIBLE_METRICS_STORAGE_KEY = 'cgsi_esg_visible_metrics';
export const BASELINE_ESG_THRESHOLD = 50;
export const MOMENTUM_THRESHOLD = 55;
export const MOMENTUM_RATE_THRESHOLD = 10;

export const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', path: '/', icon: 'LayoutDashboard' },
  { id: 'matrix', label: 'Matrix Analytics', path: '/matrix', icon: 'Grid3x3' },
  { id: 'screener', label: 'Portfolio Screener', path: '/screener', icon: 'Search' },
  { id: 'forum', label: 'Investor Forum', path: '/forum', icon: 'MessageSquare', badge: 'AI' },
  { id: 'reports', label: 'ESG Report Analyzer', path: '/reports', icon: 'FileText', badge: 'AI' },
  { id: 'arena', label: 'Game Arena', path: '/arena', icon: 'Gamepad2', badge: 'NEW' },
  { id: 'rewards', label: 'Rewards Store', path: '/rewards', icon: 'Gift' },
];

import { BASELINE_SERIES } from '../../utils/esgComparison';
import { ESG_VISIBLE_METRICS_STORAGE_KEY } from '../../utils/constants';
import './BaselineMetricPicker.css';

export const ALL_BASELINE_IDS = BASELINE_SERIES.map((s) => s.id);

export const METRIC_PRESETS = [
  { id: 'all', label: 'All 4', metrics: ALL_BASELINE_IDS },
  { id: 'sgx_only', label: 'SGX only', metrics: ['sgx'] },
  { id: 'msci_only', label: 'MSCI only', metrics: ['msci'] },
  { id: 'sp_only', label: 'S&P only', metrics: ['sp_global'] },
  { id: 'sus_only', label: 'Sustain. only', metrics: ['sustainalytics'] },
  { id: 'global', label: 'Global 3', metrics: ['msci', 'sp_global', 'sustainalytics'] },
  { id: 'sgx_msci', label: 'SGX + MSCI', metrics: ['sgx', 'msci'] },
  { id: 'sgx_sp', label: 'SGX + S&P', metrics: ['sgx', 'sp_global'] },
];

export function getStoredVisibleMetrics() {
  try {
    const raw = localStorage.getItem(ESG_VISIBLE_METRICS_STORAGE_KEY);
    if (!raw) return ALL_BASELINE_IDS;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return ALL_BASELINE_IDS;
    const valid = parsed.filter((id) => ALL_BASELINE_IDS.includes(id));
    return valid.length > 0 ? valid : ALL_BASELINE_IDS;
  } catch {
    return ALL_BASELINE_IDS;
  }
}

export function storeVisibleMetrics(metrics) {
  try {
    localStorage.setItem(ESG_VISIBLE_METRICS_STORAGE_KEY, JSON.stringify(metrics));
  } catch {
    /* ignore */
  }
}

function activePreset(visibleMetrics) {
  const key = [...visibleMetrics].sort().join(',');
  return METRIC_PRESETS.find((p) => [...p.metrics].sort().join(',') === key)?.id ?? 'custom';
}

export default function BaselineMetricPicker({ visibleMetrics, onChange, compact = false }) {
  const preset = activePreset(visibleMetrics);

  const toggleMetric = (id) => {
    const has = visibleMetrics.includes(id);
    if (has && visibleMetrics.length === 1) return;
    const next = has ? visibleMetrics.filter((m) => m !== id) : [...visibleMetrics, id];
    onChange(next);
  };

  const applyPreset = (metrics) => {
    onChange(metrics);
  };

  return (
    <div className={`baseline-picker ${compact ? 'baseline-picker--compact' : ''}`}>
      <div className="baseline-picker__header">
        <span className="baseline-picker__label">Show on chart</span>
        <span className="baseline-picker__count">{visibleMetrics.length} of 4</span>
      </div>

      <div className="baseline-picker__presets">
        {METRIC_PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            className={`baseline-picker__preset ${preset === p.id ? 'baseline-picker__preset--active' : ''}`}
            onClick={() => applyPreset(p.metrics)}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="baseline-picker__metrics" role="group" aria-label="Baseline metrics to display">
        {BASELINE_SERIES.map((series) => {
          const checked = visibleMetrics.includes(series.id);
          const disabled = checked && visibleMetrics.length === 1;
          return (
            <label
              key={series.id}
              className={`baseline-picker__metric ${checked ? 'baseline-picker__metric--on' : ''} ${disabled ? 'baseline-picker__metric--locked' : ''}`}
              title={series.description}
            >
              <input
                type="checkbox"
                checked={checked}
                disabled={disabled}
                onChange={() => toggleMetric(series.id)}
              />
              <span className="baseline-picker__dot" style={{ background: series.color }} />
              <span className="baseline-picker__metric-name">{series.shortName}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
